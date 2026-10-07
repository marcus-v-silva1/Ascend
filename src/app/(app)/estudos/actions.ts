"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getQuestionProgress, getSubjects } from "@/lib/data/study";
import { gradeAnswer, scoreSession, type QuestionType } from "@/lib/grading";
import { newCardRow } from "@/lib/srs";
import { questionNumber } from "@/lib/question-import";
import { descendantIds, filterQuestions, pickInterleaved } from "@/lib/study";

const startSchema = z.object({
  mode: z.enum(["practice", "mock"]),
  presetId: z.uuid().optional(),
  subjectIds: z.array(z.uuid()).min(1, "Escolha pelo menos um assunto."),
  count: z.coerce.number().int().min(1).max(200),
  filter: z.enum(["all", "unseen", "wrong", "weak"]).default("all"),
});

export type StartState = { error?: string };

export async function startSession(_prev: StartState, formData: FormData): Promise<StartState> {
  const { supabase } = await requireUser();
  const parsed = startSchema.safeParse({
    mode: formData.get("mode"),
    presetId: formData.get("presetId") || undefined,
    subjectIds: formData.getAll("subjectIds"),
    count: formData.get("count"),
    filter: formData.get("filter") || "all",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { mode, presetId, subjectIds, count, filter } = parsed.data;

  let durationMin: number | null = null;
  let passPct: number | null = null;
  let officialCount: number | null = null;
  let tag: string | null = null;
  if (presetId) {
    const { data: preset } = await supabase
      .from("exam_presets")
      .select("duration_min, pass_pct, question_count, tag")
      .eq("id", presetId)
      .single();
    if (preset) {
      durationMin = preset.duration_min;
      passPct = preset.pass_pct;
      officialCount = preset.question_count;
      tag = preset.tag;
    }
  }

  let questionIds: string[];
  if (tag) {
    // Prova anterior: todas as questões, na ordem original, sem sorteio
    const { data: rows } = await supabase.from("questions").select("id, external_id").contains("tags", [tag]);
    questionIds = ((rows ?? []) as { id: string; external_id: string | null }[])
      .sort((a, b) => questionNumber(a.external_id) - questionNumber(b.external_id))
      .map((r) => r.id);
    if (questionIds.length === 0) return { error: "As questões desta prova não foram encontradas. Importe o arquivo de novo." };
  } else {
    const subjects = await getSubjects(supabase);
    const scope = [...new Set(subjectIds.flatMap((id) => descendantIds(subjects, id)))];
    const progress = await getQuestionProgress(supabase, scope);
    const pool = filterQuestions(progress, filter);
    if (pool.length === 0) {
      return { error: "Nenhuma questão encontrada com esse filtro. Tente 'Todas' ou outro assunto." };
    }
    questionIds = pickInterleaved(pool, count);
  }

  // Menos questões que o oficial (anuladas, falta de banco): tempo proporcional
  if (durationMin && officialCount && questionIds.length < officialCount && !tag) {
    durationMin = Math.max(1, Math.round((durationMin * questionIds.length) / officialCount));
  }

  const { data: session, error } = await supabase
    .from("study_sessions")
    .insert({
      mode,
      preset_id: presetId ?? null,
      subject_ids: subjectIds,
      question_ids: questionIds,
      duration_min: mode === "mock" ? durationMin : null,
      pass_pct: passPct,
      total: questionIds.length,
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível iniciar a sessão." };

  redirect(`/estudos/sessao/${session.id}`);
}

async function loadQuestion(questionId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("questions")
    .select("id, type, stem, options, correct, explanation")
    .eq("id", questionId)
    .single();
  if (error) throw new Error("Questão não encontrada.");
  return { supabase, question: data };
}

const MISTAKES_DECK = "d-mistakes";

/** Questão errada vira flashcard no deck "Meus erros" (uma vez por questão). */
async function ensureMistakeCard(questionId: string, whyWrong?: string | null) {
  const { supabase, userId } = await requireUser();
  const { data: q } = await supabase
    .from("questions")
    .select("id, stem, options, correct, explanation")
    .eq("id", questionId)
    .single();
  if (!q) return;

  let { data: deck } = await supabase.from("decks").select("id").eq("external_id", MISTAKES_DECK).maybeSingle();
  if (!deck) {
    const { data: created } = await supabase
      .from("decks")
      .insert({ user_id: userId, external_id: MISTAKES_DECK, name: "Meus erros", description: "Questões que você errou viram cartões automaticamente." })
      .select("id")
      .single();
    deck = created;
  }
  if (!deck) return;

  const options = q.options as { id: string; text: string }[];
  const correct = new Set(q.correct as string[]);
  const front = `${q.stem}\n\n${options.map((o) => `${o.id.length === 1 ? `${o.id.toUpperCase()}) ` : ""}${o.text}`).join("\n")}`;
  const answer = options.filter((o) => correct.has(o.id)).map((o) => o.text).join(" + ");
  const back = [`Resposta: ${answer}`, q.explanation, whyWrong ? `Por que errei: ${whyWrong}` : null]
    .filter(Boolean)
    .join("\n\n");

  const { data: existing } = await supabase.from("flashcards").select("id").eq("question_id", q.id).maybeSingle();
  if (existing) {
    await supabase.from("flashcards").update({ back, suspended: false }).eq("id", existing.id);
  } else {
    await supabase.from("flashcards").insert({
      deck_id: deck.id,
      question_id: q.id,
      front,
      back,
      source: "question",
      ...newCardRow(),
    });
  }
}

const answerSchema = z.object({
  sessionId: z.uuid(),
  questionId: z.uuid(),
  selected: z.array(z.string()).max(10),
  timeMs: z.number().int().min(0).max(3_600_000),
});

/** Modo prática: corrige na hora e devolve gabarito + explicação. */
export async function submitPracticeAnswer(input: z.infer<typeof answerSchema>) {
  const { sessionId, questionId, selected, timeMs } = answerSchema.parse(input);
  const { supabase, question } = await loadQuestion(questionId);
  const isCorrect = gradeAnswer(question.type as QuestionType, question.correct as string[], selected);

  const { data: attempt } = await supabase
    .from("attempts")
    .insert({ question_id: questionId, session_id: sessionId, selected, is_correct: isCorrect, time_ms: timeMs })
    .select("id")
    .single();

  if (!isCorrect) await ensureMistakeCard(questionId);

  return {
    attemptId: attempt?.id ?? null,
    isCorrect,
    correct: question.correct as string[],
    explanation: question.explanation as string | null,
  };
}

const finishSchema = z.object({
  sessionId: z.uuid(),
  answers: z.array(
    z.object({
      questionId: z.uuid(),
      selected: z.array(z.string()).max(10),
      timeMs: z.number().int().min(0).max(3_600_000),
    }),
  ),
});

/** Encerra a sessão. No simulado, corrige todas as respostas de uma vez. */
export async function finishSession(input: z.infer<typeof finishSchema>) {
  const { sessionId, answers } = finishSchema.parse(input);
  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id, mode, question_ids, pass_pct, finished_at")
    .eq("id", sessionId)
    .single();
  if (!session) throw new Error("Sessão não encontrada.");

  if (session.mode === "mock" && !session.finished_at) {
    const ids = session.question_ids as string[];
    const { data: questions } = await supabase.from("questions").select("id, type, correct").in("id", ids);
    const byId = new Map((questions ?? []).map((q: { id: string }) => [q.id, q]));
    const answered = new Map(answers.map((a) => [a.questionId, a]));

    // Questões não respondidas contam como erro, como na prova real
    const rows = ids.map((id) => {
      const q = byId.get(id) as { type: QuestionType; correct: string[] } | undefined;
      const a = answered.get(id);
      const selected = a?.selected ?? [];
      return {
        question_id: id,
        session_id: sessionId,
        selected,
        is_correct: q ? gradeAnswer(q.type, q.correct, selected) : false,
        time_ms: a?.timeMs ?? null,
      };
    });
    await supabase.from("attempts").insert(rows);
    for (const r of rows.filter((r) => !r.is_correct)) await ensureMistakeCard(r.question_id);
  }

  const { data: attempts } = await supabase.from("attempts").select("is_correct").eq("session_id", sessionId);
  const total = session.mode === "mock" ? (session.question_ids as string[]).length : (attempts ?? []).length;
  const correct = (attempts ?? []).filter((a: { is_correct: boolean }) => a.is_correct).length;
  const { pct } = scoreSession(correct, total, session.pass_pct ?? 0);

  await supabase
    .from("study_sessions")
    .update({ finished_at: new Date().toISOString(), correct_count: correct, total, score_pct: pct })
    .eq("id", sessionId);

  revalidatePath("/estudos");
  revalidatePath("/dashboard");
  return { url: `/estudos/sessao/${sessionId}/resultado` };
}

const whySchema = z.object({ attemptId: z.uuid(), whyWrong: z.string().trim().min(3).max(2000) });

/** Autoexplicação: o motivo do erro vai para a tentativa e para o verso do flashcard. */
export async function saveWhyWrong(input: z.infer<typeof whySchema>) {
  const { attemptId, whyWrong } = whySchema.parse(input);
  const { supabase } = await requireUser();
  const { data: attempt } = await supabase
    .from("attempts")
    .update({ why_wrong: whyWrong })
    .eq("id", attemptId)
    .select("question_id")
    .single();
  if (attempt) await ensureMistakeCard(attempt.question_id, whyWrong);
  return { ok: true };
}

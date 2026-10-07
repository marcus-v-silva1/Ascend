import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { descendantIds, isMastered, type QuestionProgress } from "@/lib/study";

type Client = SupabaseClient<Database>;

export type SubjectRow = {
  id: string;
  parent_id: string | null;
  name: string;
  kind: "exam" | "discipline" | "topic";
  description: string | null;
  position: number;
};

export async function getSubjects(supabase: Client): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, parent_id, name, kind, description, position")
    .order("position");
  if (error) throw error;
  return data ?? [];
}

/** Progresso por questão (tentativas, último acerto, dias de acerto). */
export async function getQuestionProgress(supabase: Client, subjectIds?: string[]): Promise<QuestionProgress[]> {
  let query = supabase.from("questions").select("id, subject_id");
  if (subjectIds) query = query.in("subject_id", subjectIds);
  const [{ data: questions, error }, { data: mastery, error: mErr }] = await Promise.all([
    query,
    supabase.from("question_mastery").select("question_id, correct_days, last_correct, attempts"),
  ]);
  if (error) throw error;
  if (mErr) throw mErr;

  const byQuestion = new Map((mastery ?? []).map((m: { question_id: string }) => [m.question_id, m]));
  return (questions ?? []).map((q: { id: string; subject_id: string | null }) => {
    const m = byQuestion.get(q.id) as
      | { correct_days: number; last_correct: boolean; attempts: number }
      | undefined;
    return {
      id: q.id,
      subject_id: q.subject_id,
      attempts: m?.attempts ?? 0,
      last_correct: m?.last_correct ?? null,
      correct_days: m?.correct_days ?? 0,
    };
  });
}

export type ExamOverview = {
  subject: SubjectRow;
  topics: { subject: SubjectRow; total: number; seen: number; mastered: number; accuracy: number | null }[];
  total: number;
  seen: number;
  mastered: number;
  accuracy: number | null;
  presets: {
    id: string;
    name: string;
    question_count: number;
    duration_min: number;
    pass_pct: number;
    ready_pct: number;
    official_url: string | null;
    lastScores: number[];
  }[];
};

export async function getExamsOverview(supabase: Client): Promise<ExamOverview[]> {
  const [subjects, progress, statsRes, presetsRes, sessionsRes] = await Promise.all([
    getSubjects(supabase),
    getQuestionProgress(supabase),
    supabase.from("subject_stats").select("subject_id, attempts, correct"),
    supabase.from("exam_presets").select("id, name, subject_id, question_count, duration_min, pass_pct, ready_pct, official_url").order("question_count", { ascending: false }),
    supabase
      .from("study_sessions")
      .select("preset_id, score_pct, total, finished_at")
      .eq("mode", "mock")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(200),
  ]);

  const stats = new Map(
    (statsRes.data ?? []).map((s: { subject_id: string; attempts: number; correct: number }) => [s.subject_id, s]),
  );

  const summarize = (ids: string[]) => {
    const idSet = new Set(ids);
    const qs = progress.filter((q) => q.subject_id && idSet.has(q.subject_id));
    let attempts = 0;
    let correct = 0;
    for (const id of ids) {
      const s = stats.get(id) as { attempts: number; correct: number } | undefined;
      if (s) {
        attempts += Number(s.attempts);
        correct += Number(s.correct);
      }
    }
    return {
      total: qs.length,
      seen: qs.filter((q) => q.attempts > 0).length,
      mastered: qs.filter(isMastered).length,
      accuracy: attempts ? Math.round((correct / attempts) * 1000) / 10 : null,
    };
  };

  return subjects
    .filter((s) => s.kind === "exam")
    .map((exam) => {
      const children = subjects.filter((s) => s.parent_id === exam.id);
      const presets = (presetsRes.data ?? [])
        .filter((p: { subject_id: string | null }) => p.subject_id === exam.id)
        .map((p: Omit<ExamOverview["presets"][number], "lastScores"> & { subject_id: string }) => ({
          ...p,
          lastScores: (sessionsRes.data ?? [])
            .filter((s: { preset_id: string | null }) => s.preset_id === p.id)
            .map((s: { score_pct: number }) => Number(s.score_pct)),
        }));
      return {
        subject: exam,
        topics: children.map((t) => ({ subject: t, ...summarize(descendantIds(subjects, t.id)) })),
        presets,
        ...summarize(descendantIds(subjects, exam.id)),
      };
    });
}

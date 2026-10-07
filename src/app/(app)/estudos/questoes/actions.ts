"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toQuestionRow, type SeedQuestion } from "@/content/types";
import { requireUser } from "@/lib/auth";

const importItem = z.object({
  subject: z.string().min(1),
  stem: z.string().min(5),
  options: z.array(z.string().min(1)).min(2).max(10).optional(),
  correct: z.union([z.boolean(), z.array(z.number().int().min(0)).min(1), z.array(z.string().regex(/^[a-j]$/i)).min(1)]),
  explanation: z.string().default(""),
  source: z.string().optional(),
  source_url: z.url().optional(),
  board: z.string().optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export type ImportState = { error?: string; imported?: number };

/** Importa questões em JSON. `subject` aceita o id externo (ex.: "psm-eventos") ou o nome do assunto. */
export async function importQuestions(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { supabase } = await requireUser();
  const file = formData.get("file");
  const raw = file instanceof File && file.size > 0 ? await file.text() : String(formData.get("json") ?? "");
  if (!raw.trim()) return { error: "Cole o JSON ou escolha um arquivo." };

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "JSON inválido. Confira vírgulas e aspas." };
  }
  const parsed = z.array(importItem).max(2000).safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `Item ${String(issue.path[0] ?? "")}: ${issue.path.slice(1).join(".")} ${issue.message}` };
  }

  const { data: subjects } = await supabase.from("subjects").select("id, external_id, name");
  const lookup = new Map<string, string>();
  for (const s of subjects ?? []) {
    if (s.external_id) lookup.set(s.external_id.toLowerCase(), s.id);
    lookup.set(s.name.toLowerCase(), s.id);
  }

  const rows = [];
  for (const [i, item] of parsed.data.entries()) {
    const subjectId = lookup.get(item.subject.toLowerCase());
    if (!subjectId) return { error: `Item ${i}: assunto "${item.subject}" não existe.` };
    const correct =
      typeof item.correct === "boolean"
        ? item.correct
        : item.correct.map((c) => (typeof c === "number" ? c : c.toLowerCase().charCodeAt(0) - 97));
    if (typeof correct !== "boolean" && correct.some((c) => c >= (item.options?.length ?? 0))) {
      return { error: `Item ${i}: gabarito aponta para alternativa inexistente.` };
    }
    const row = toQuestionRow({ ...item, id: "", correct, explanation: item.explanation, difficulty: item.difficulty as SeedQuestion["difficulty"] });
    rows.push({ ...row, external_id: null, subject_id: subjectId });
  }

  const { error } = await supabase.from("questions").insert(rows);
  if (error) return { error: "Não foi possível salvar as questões." };
  revalidatePath("/estudos", "layout");
  return { imported: rows.length };
}

const createSchema = z.object({
  subjectId: z.uuid(),
  stem: z.string().trim().min(5, "Escreva o enunciado."),
  kind: z.enum(["choice", "truefalse"]),
  options: z.array(z.string().trim()).max(6),
  correct: z.array(z.string()),
  explanation: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(200).optional(),
});

export type CreateState = { error?: string; ok?: boolean };

export async function createQuestion(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const { supabase } = await requireUser();
  const parsed = createSchema.safeParse({
    subjectId: formData.get("subjectId"),
    stem: formData.get("stem"),
    kind: formData.get("kind"),
    options: formData.getAll("options"),
    correct: formData.getAll("correct"),
    explanation: formData.get("explanation") || undefined,
    source: formData.get("source") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let row;
  if (d.kind === "truefalse") {
    if (d.correct.length !== 1) return { error: "Marque se a afirmação está certa ou errada." };
    row = toQuestionRow({ id: "", subject: "", stem: d.stem, correct: d.correct[0] === "true", explanation: d.explanation ?? "", source: d.source });
  } else {
    // Mantém o índice original das alternativas preenchidas
    const filled = d.options.map((text, i) => ({ text, i })).filter((o) => o.text.length > 0);
    if (filled.length < 2) return { error: "Preencha pelo menos duas alternativas." };
    const correctIdx = d.correct.map(Number).map((orig) => filled.findIndex((f) => f.i === orig)).filter((i) => i >= 0);
    if (correctIdx.length === 0) return { error: "Marque a(s) alternativa(s) correta(s)." };
    row = toQuestionRow({ id: "", subject: "", stem: d.stem, options: filled.map((f) => f.text), correct: correctIdx, explanation: d.explanation ?? "", source: d.source });
  }
  const { error } = await supabase.from("questions").insert({ ...row, external_id: null, subject_id: d.subjectId, source: d.source ?? "Minha questão" });
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/estudos", "layout");
  return { ok: true };
}

export async function deleteQuestion(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath("/estudos", "layout");
}

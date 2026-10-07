"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toQuestionRow, type SeedQuestion } from "@/content/types";
import { requireUser } from "@/lib/auth";
import { parseImport, provaTag, stemKey } from "@/lib/question-import";

export type ImportState = { error?: string; imported?: number; reused?: number; prova?: string };

/**
 * Importa questões em JSON: uma lista ou { prova, questions }.
 * `subject` aceita o código do assunto (ex.: "psm-eventos") ou o nome.
 * Questões com o mesmo enunciado de uma já existente são reaproveitadas (só ganham a etiqueta da prova).
 */
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
  const parsed = parseImport(json);
  if (!parsed.ok) return { error: parsed.error };
  const { prova, items } = parsed.data;

  const [{ data: subjects }, { data: existing }] = await Promise.all([
    supabase.from("subjects").select("id, external_id, name"),
    supabase.from("questions").select("id, stem, external_id, tags"),
  ]);
  const lookup = new Map<string, string>();
  for (const s of subjects ?? []) {
    if (s.external_id) lookup.set(s.external_id.toLowerCase(), s.id);
    lookup.set(s.name.toLowerCase(), s.id);
  }
  type Existing = { id: string; stem: string; external_id: string | null; tags: string[] };
  const byStem = new Map(((existing ?? []) as Existing[]).map((q) => [stemKey(q.stem), q]));
  const byExternal = new Map(((existing ?? []) as Existing[]).filter((q) => q.external_id).map((q) => [q.external_id!, q]));

  const rows = [];
  const retag: { id: string; tags: string[] }[] = [];
  for (const [i, item] of items.entries()) {
    const subjectId = lookup.get(item.subject.toLowerCase());
    if (!subjectId) return { error: `Item ${i}: assunto "${item.subject}" não existe.` };
    const same = (item.id && byExternal.get(item.id)) || byStem.get(stemKey(item.stem));
    if (same) {
      const tags = [...new Set([...(same.tags ?? []), ...(item.tags ?? [])])];
      if (tags.length !== (same.tags ?? []).length) retag.push({ id: same.id, tags });
      continue;
    }
    const row = toQuestionRow({ ...item, id: "", explanation: item.explanation, difficulty: item.difficulty as SeedQuestion["difficulty"] });
    rows.push({ ...row, external_id: item.id ?? null, subject_id: subjectId, tags: item.tags ?? [] });
    byStem.set(stemKey(item.stem), { id: "", stem: item.stem, external_id: item.id ?? null, tags: item.tags ?? [] });
  }

  if (rows.length) {
    const { error } = await supabase.from("questions").insert(rows);
    if (error) return { error: "Não foi possível salvar as questões." };
  }
  for (const r of retag) await supabase.from("questions").update({ tags: r.tags }).eq("id", r.id);

  if (prova) {
    const subjectId = lookup.get(prova.subject.toLowerCase()) ?? null;
    const { error } = await supabase.from("exam_presets").upsert(
      {
        external_id: `prova-${prova.slug}`,
        name: prova.name,
        subject_id: subjectId,
        question_count: items.length,
        duration_min: prova.durationMin,
        pass_pct: prova.passPct,
        ready_pct: Math.min(100, prova.passPct + 15),
        official_url: prova.officialUrl ?? null,
        tag: provaTag(prova.slug),
      },
      { onConflict: "user_id,external_id" },
    );
    if (error) return { error: "Questões salvas, mas não foi possível criar o simulado da prova." };
  }

  revalidatePath("/estudos", "layout");
  return { imported: rows.length, reused: items.length - rows.length, prova: prova?.name };
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

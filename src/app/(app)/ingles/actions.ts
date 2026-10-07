"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { newCardRow } from "@/lib/srs";

export type FormState = { error?: string; ok?: boolean; message?: string };

const KINDS = ["lesson", "class", "listening", "speaking", "reading", "writing", "vocab"] as const;

function refresh() {
  revalidatePath("/ingles");
  revalidatePath("/dashboard");
  revalidatePath("/carreira", "layout");
}

/** Mantém os KRs de inglês alinhados com o que foi registrado. */
async function syncEnglishKRs() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("english_activity").select("kind, minutes");
  const rows = (data ?? []) as { kind: string; minutes: number }[];
  const hours = Math.floor(rows.reduce((s, r) => s + r.minutes, 0) / 60);
  const speaking = rows.filter((r) => r.kind === "speaking" || r.kind === "class").length;
  await Promise.all([
    supabase.from("key_results").update({ current_value: hours }).eq("external_id", "kr-en-hours"),
    supabase.from("key_results").update({ current_value: speaking }).eq("external_id", "kr-en-speaking"),
  ]);
}

export async function logActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({
      kind: z.enum(KINDS),
      minutes: z.coerce.number().int().min(1, "Informe os minutos.").max(600),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      note: z.string().trim().max(500).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("english_activity").insert(parsed.data);
  if (error) return { error: "Não foi possível registrar." };

  // Registrar inglês também marca o hábito do dia
  const { data: habit } = await supabase.from("habits").select("id").eq("external_id", "h-english").maybeSingle();
  if (habit && parsed.data.minutes >= 20) {
    await supabase.from("habit_logs").upsert({ habit_id: habit.id, date: parsed.data.date }, { onConflict: "habit_id,date", ignoreDuplicates: true });
  }
  await syncEnglishKRs();
  refresh();
  return { ok: true, message: `${parsed.data.minutes} min registrados.` };
}

export async function addVocab(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({
      word: z.string().trim().min(1, "Escreva a palavra ou expressão.").max(200),
      meaning: z.string().trim().min(1, "Escreva o significado.").max(500),
      example: z.string().trim().max(500).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: deck } = await supabase.from("decks").select("id").eq("external_id", "d-vocab").maybeSingle();
  if (!deck) return { error: "Deck de vocabulário não encontrado." };
  const { word, meaning, example } = parsed.data;
  const { error } = await supabase.from("flashcards").insert({
    deck_id: deck.id,
    front: word,
    back: example ? `${meaning}\n\n“${example}”` : meaning,
    source: "vocab",
    ...newCardRow(),
  });
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  revalidatePath("/flashcards", "layout");
  return { ok: true, message: `“${word}” vai aparecer na revisão.` };
}

// Dados exportados pelo script `npm run times:sync`
const unitSchema = z.object({
  ref: z.string().min(1),
  title: z.string().min(1),
  position: z.number().int().optional(),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  score: z.number().min(0).max(100).nullable().optional(),
  completedAt: z.string().nullable().optional(),
});
const courseSchema = z.object({
  platform: z.enum(["times_digital_books", "times_connected"]),
  ref: z.string().min(1),
  title: z.string().min(1),
  level: z.string().nullable().optional(),
  units: z.array(unitSchema).max(1000),
});
const vocabSchema = z.object({ word: z.string().min(1), meaning: z.string().min(1) });
const syncSchema = z.object({
  exportedAt: z.string(),
  courses: z.array(courseSchema).max(100),
  vocab: z.array(vocabSchema).max(5000).optional(),
});

export async function importTimesData(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha o arquivo times-export.json." };
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return { error: "Arquivo não é um JSON válido." };
  }
  const parsed = syncSchema.safeParse(json);
  if (!parsed.success) return { error: `Formato inesperado: ${parsed.error.issues[0].path.join(".")}` };

  let units = 0;
  for (const c of parsed.data.courses) {
    const { data: course, error } = await supabase
      .from("english_courses")
      .upsert(
        { user_id: userId, platform: c.platform, external_ref: c.ref, title: c.title, level: c.level ?? null, synced_at: parsed.data.exportedAt },
        { onConflict: "user_id,platform,external_ref" },
      )
      .select("id")
      .single();
    if (error || !course) return { error: `Falha ao salvar o curso ${c.title}.` };
    if (c.units.length) {
      const { error: uErr } = await supabase.from("english_units").upsert(
        c.units.map((u, i) => ({
          user_id: userId,
          course_id: course.id,
          external_ref: u.ref,
          title: u.title,
          position: u.position ?? i,
          status: u.status,
          score: u.score ?? null,
          completed_at: u.completedAt ?? null,
        })),
        { onConflict: "course_id,external_ref" },
      );
      if (uErr) return { error: `Falha ao salvar unidades de ${c.title}.` };
      units += c.units.length;
    }
  }

  let words = 0;
  if (parsed.data.vocab?.length) {
    const { data: deck } = await supabase.from("decks").select("id").eq("external_id", "d-vocab").maybeSingle();
    const { data: existing } = await supabase.from("flashcards").select("front").eq("source", "vocab");
    const known = new Set((existing ?? []).map((e: { front: string }) => e.front.toLowerCase()));
    const fresh = parsed.data.vocab.filter((v) => !known.has(v.word.toLowerCase()));
    if (deck && fresh.length) {
      const base = newCardRow();
      await supabase.from("flashcards").insert(fresh.map((v) => ({ deck_id: deck.id, front: v.word, back: v.meaning, source: "vocab" as const, ...base })));
      words = fresh.length;
    }
  }

  refresh();
  return { ok: true, message: `${parsed.data.courses.length} cursos, ${units} unidades e ${words} palavras novas importadas.` };
}

export async function setUnitStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["todo", "doing", "done"]).parse(formData.get("status"));
  await supabase
    .from("english_units")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id);
  refresh();
}

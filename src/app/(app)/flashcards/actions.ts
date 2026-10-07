"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseCardsCsv } from "@/lib/csv";
import { newCardRow, pickCardFields, scheduleReview, type CardRow, type Grade } from "@/lib/srs";

const reviewSchema = z.object({ cardId: z.uuid(), rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) });

export async function reviewCard(input: z.infer<typeof reviewSchema>) {
  const { cardId, rating } = reviewSchema.parse(input);
  const { supabase } = await requireUser();
  const { data: card, error } = await supabase
    .from("flashcards")
    .select("id, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review")
    .eq("id", cardId)
    .single();
  if (error || !card) throw new Error("Cartão não encontrado.");

  const { card: next, log } = scheduleReview(pickCardFields(card as CardRow), rating as Grade);
  await Promise.all([
    supabase.from("flashcards").update(next).eq("id", cardId),
    supabase.from("review_logs").insert({ ...log, card_id: cardId }),
  ]);
  revalidatePath("/dashboard");
  return { due: next.due };
}

export type FormState = { error?: string; ok?: boolean; message?: string };

const deckSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao deck.").max(80),
  description: z.string().trim().max(300).optional(),
});

export async function createDeck(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = deckSchema.safeParse({ name: formData.get("name"), description: formData.get("description") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("decks").insert(parsed.data);
  if (error) return { error: "Não foi possível criar o deck." };
  revalidatePath("/flashcards");
  return { ok: true, message: "Deck criado." };
}

const cardSchema = z.object({
  deckId: z.uuid(),
  front: z.string().trim().min(1, "Preencha a frente.").max(4000),
  back: z.string().trim().min(1, "Preencha o verso.").max(8000),
});

export async function createCard(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = cardSchema.safeParse({ deckId: formData.get("deckId"), front: formData.get("front"), back: formData.get("back") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { deckId, front, back } = parsed.data;

  const { data: deck } = await supabase.from("decks").select("external_id").eq("id", deckId).single();
  const source = deck?.external_id === "d-vocab" ? "vocab" : deck?.external_id === "d-interview" ? "phrase" : "manual";
  const { error } = await supabase.from("flashcards").insert({ deck_id: deckId, front, back, source, ...newCardRow() });
  if (error) return { error: "Não foi possível salvar o cartão." };
  revalidatePath("/flashcards", "layout");
  revalidatePath("/ingles");
  return { ok: true, message: "Cartão adicionado." };
}

export async function importCards(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const deckId = z.uuid().safeParse(formData.get("deckId"));
  if (!deckId.success) return { error: "Escolha um deck." };
  const file = formData.get("file");
  const raw = file instanceof File && file.size > 0 ? await file.text() : String(formData.get("text") ?? "");
  const cards = parseCardsCsv(raw);
  if (cards.length === 0) return { error: "Nenhum cartão encontrado. Use uma linha por cartão: frente;verso" };
  if (cards.length > 5000) return { error: "Máximo de 5000 cartões por importação." };

  const base = newCardRow();
  const { error } = await supabase
    .from("flashcards")
    .insert(cards.map((c) => ({ deck_id: deckId.data, front: c.front, back: c.back, source: "manual" as const, ...base })));
  if (error) return { error: "Não foi possível importar." };
  revalidatePath("/flashcards", "layout");
  return { ok: true, message: `${cards.length} cartões importados.` };
}

export async function deleteCard(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.from("flashcards").delete().eq("id", id);
  revalidatePath("/flashcards", "layout");
}

export async function toggleSuspend(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const suspended = formData.get("suspended") === "true";
  await supabase.from("flashcards").update({ suspended: !suspended }).eq("id", id);
  revalidatePath("/flashcards", "layout");
}

export async function deleteDeck(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.from("decks").delete().eq("id", id);
  revalidatePath("/flashcards", "layout");
}

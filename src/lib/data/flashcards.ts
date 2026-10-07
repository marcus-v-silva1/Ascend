import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfLocalDay } from "@/lib/dates";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type DeckSummary = {
  id: string;
  name: string;
  description: string | null;
  external_id: string | null;
  total: number;
  due: number;
  fresh: number;
};

const CARD_FIELDS =
  "id, deck_id, front, back, source, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review";

export async function getDeckSummaries(supabase: Client): Promise<DeckSummary[]> {
  const now = new Date().toISOString();
  const [{ data: decks }, { data: cards }] = await Promise.all([
    supabase.from("decks").select("id, name, description, external_id").order("created_at"),
    supabase.from("flashcards").select("deck_id, state, due").eq("suspended", false),
  ]);
  return (decks ?? []).map((d: Omit<DeckSummary, "total" | "due" | "fresh">) => {
    const mine = (cards ?? []).filter((c: { deck_id: string }) => c.deck_id === d.id);
    return {
      ...d,
      total: mine.length,
      due: mine.filter((c: { state: number; due: string }) => c.state !== 0 && c.due <= now).length,
      fresh: mine.filter((c: { state: number }) => c.state === 0).length,
    };
  });
}

/** Quantos cartões novos ainda cabem hoje, respeitando o limite do perfil. */
export async function newCardsLeftToday(supabase: Client, userId: string) {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("daily_new_cards").eq("id", userId).maybeSingle(),
    supabase
      .from("review_logs")
      .select("id", { count: "exact", head: true })
      .eq("state", 0)
      .gte("review", startOfLocalDay()),
  ]);
  return Math.max(0, (profile?.daily_new_cards ?? 20) - (count ?? 0));
}

/** Fila do dia: revisões vencidas primeiro, depois cartões novos até o limite diário. */
export async function getReviewQueue(supabase: Client, userId: string, deckId?: string) {
  const now = new Date().toISOString();
  let due = supabase
    .from("flashcards")
    .select(CARD_FIELDS)
    .eq("suspended", false)
    .neq("state", 0)
    .lte("due", now)
    .order("due")
    .limit(300);
  if (deckId) due = due.eq("deck_id", deckId);

  const left = await newCardsLeftToday(supabase, userId);
  let fresh = supabase
    .from("flashcards")
    .select(CARD_FIELDS)
    .eq("suspended", false)
    .eq("state", 0)
    .order("created_at")
    .limit(left);
  if (deckId) fresh = fresh.eq("deck_id", deckId);

  const [{ data: dueCards }, { data: newCards }] = await Promise.all([due, left > 0 ? fresh : Promise.resolve({ data: [] })]);
  return [...(dueCards ?? []), ...(newCards ?? [])];
}

/** Total de cartões para revisar hoje (para o dashboard). */
export async function countDueToday(supabase: Client, userId: string) {
  const now = new Date().toISOString();
  const [{ count: due }, { count: fresh }, left] = await Promise.all([
    supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("suspended", false).neq("state", 0).lte("due", now),
    supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("suspended", false).eq("state", 0),
    newCardsLeftToday(supabase, userId),
  ]);
  return { due: due ?? 0, fresh: Math.min(fresh ?? 0, left) };
}

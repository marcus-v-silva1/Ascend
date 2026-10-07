import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getReviewQueue } from "@/lib/data/flashcards";
import type { CardRow } from "@/lib/srs";
import { ReviewSession } from "./review-session";

export const metadata: Metadata = { title: "Revisar flashcards" };

export default async function ReviewPage({ searchParams }: PageProps<"/flashcards/revisar">) {
  const sp = await searchParams;
  const deckId = typeof sp.deck === "string" ? sp.deck : undefined;
  const { supabase, userId } = await requireUser();
  const queue = await getReviewQueue(supabase, userId, deckId);

  let deckName: string | null = null;
  if (deckId) {
    const { data } = await supabase.from("decks").select("name").eq("id", deckId).maybeSingle();
    deckName = data?.name ?? null;
  }

  return (
    <ReviewSession
      deckName={deckName}
      cards={queue.map((c: CardRow & { id: string; front: string; back: string; source: string }) => c)}
    />
  );
}

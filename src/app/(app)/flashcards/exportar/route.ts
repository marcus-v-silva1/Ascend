import { NextResponse, type NextRequest } from "next/server";
import { isOwner } from "@/lib/env";
import { toCardsCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || !isOwner(data.claims.email as string)) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const deckId = request.nextUrl.searchParams.get("deck");
  let query = supabase.from("flashcards").select("front, back").order("created_at");
  if (deckId) query = query.eq("deck_id", deckId);
  const { data: cards } = await query;

  let name = "flashcards";
  if (deckId) {
    const { data: deck } = await supabase.from("decks").select("name").eq("id", deckId).maybeSingle();
    if (deck) name = deck.name.normalize("NFD").replace(/[^\w-]+/g, "-").toLowerCase();
  }

  return new NextResponse(toCardsCsv(cards ?? []), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.txt"`,
    },
  });
}

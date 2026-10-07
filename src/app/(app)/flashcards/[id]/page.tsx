import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { deleteCard, deleteDeck, toggleSuspend } from "../actions";
import { CardForm } from "../forms";

export const metadata: Metadata = { title: "Deck" };

const STATE = ["novo", "aprendendo", "revisão", "reaprendendo"];

export default async function DeckPage({ params }: PageProps<"/flashcards/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data: deck }, { data: cards }] = await Promise.all([
    supabase.from("decks").select("id, name, description, external_id").eq("id", id).maybeSingle(),
    supabase
      .from("flashcards")
      .select("id, front, back, state, due, reps, lapses, suspended")
      .eq("deck_id", id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (!deck) notFound();

  return (
    <>
      <PageHeader
        title={deck.name}
        description={deck.description ?? undefined}
        actions={
          <>
            <LinkButton href={`/flashcards/revisar?deck=${deck.id}`}>Revisar</LinkButton>
            <a href={`/flashcards/exportar?deck=${deck.id}`} className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm hover:bg-muted">
              Exportar para Anki
            </a>
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y rounded-lg border bg-card">
          {(cards ?? []).map((c: { id: string; front: string; back: string; state: number; due: string; reps: number; lapses: number; suspended: boolean }) => (
            <li key={c.id} className={c.suspended ? "px-4 py-3 opacity-50" : "px-4 py-3"}>
              <details>
                <summary className="cursor-pointer list-none">
                  <p className="line-clamp-2 text-sm">{c.front}</p>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {STATE[c.state]} · {c.state === 0 ? "ainda não estudado" : `volta ${formatDate(c.due, true)}`} · {c.reps} revisões
                    {c.lapses > 0 && ` · esqueceu ${c.lapses}x`}
                    {c.suspended && " · suspenso"}
                  </p>
                </summary>
                <p className="mt-3 rounded-md bg-muted p-3 text-sm whitespace-pre-line">{c.back}</p>
                <div className="mt-2 flex gap-4 text-xs">
                  <form action={toggleSuspend}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="suspended" value={String(c.suspended)} />
                    <button type="submit" className="text-muted-foreground hover:text-foreground">{c.suspended ? "Reativar" : "Suspender"}</button>
                  </form>
                  <form action={deleteCard}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-muted-foreground hover:text-destructive">Excluir</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
          {(cards ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Deck vazio. Adicione o primeiro cartão ao lado.</li>}
        </ul>
        <div className="space-y-6">
          <section aria-labelledby="add" className="rounded-lg border bg-card p-5">
            <h2 id="add" className="mb-4 text-lg font-semibold">Novo cartão</h2>
            <CardForm decks={[{ id: deck.id, name: deck.name }]} defaultDeckId={deck.id} />
          </section>
          {!deck.external_id && (
            <form action={deleteDeck}>
              <input type="hidden" name="id" value={deck.id} />
              <button type="submit" className="text-sm text-muted-foreground hover:text-destructive">Excluir deck e cartões</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { countDueToday, getDeckSummaries } from "@/lib/data/flashcards";
import { CardForm, DeckForm, ImportCardsForm } from "./forms";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const { supabase, userId } = await requireUser();
  const [decks, today] = await Promise.all([getDeckSummaries(supabase), countDueToday(supabase, userId)]);
  const pending = today.due + today.fresh;

  return (
    <>
      <PageHeader
        title="Flashcards"
        description="Revisão espaçada com FSRS: cada cartão volta logo antes de você esquecer. Responda de cabeça antes de virar."
        actions={
          <LinkButton href="/flashcards/revisar" size="lg">
            {pending ? `Revisar ${pending} cartões` : "Nada para hoje"}
          </LinkButton>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Decks">
          <ul className="divide-y rounded-lg border bg-card">
            {decks.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/flashcards/${d.id}`} className="font-medium underline-offset-4 hover:underline">{d.name}</Link>
                  {d.description && <p className="line-clamp-1 text-sm text-muted-foreground">{d.description}</p>}
                </div>
                <dl className="num flex gap-4 text-sm">
                  <div className="text-center">
                    <dt className="text-xs text-muted-foreground">Vencidos</dt>
                    <dd className={d.due ? "font-semibold text-warn" : "text-muted-foreground"}>{d.due}</dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-xs text-muted-foreground">Novos</dt>
                    <dd className={d.fresh ? "font-semibold text-primary" : "text-muted-foreground"}>{d.fresh}</dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-xs text-muted-foreground">Total</dt>
                    <dd>{d.total}</dd>
                  </div>
                </dl>
                <LinkButton href={`/flashcards/revisar?deck=${d.id}`} variant="outline" size="sm" aria-label={`Revisar ${d.name}`}>
                  Revisar
                </LinkButton>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <DeckForm />
          </div>
        </section>

        <div className="space-y-8">
          <section aria-labelledby="new-card" className="rounded-lg border bg-card p-5">
            <h2 id="new-card" className="mb-4 text-lg font-semibold">Novo cartão</h2>
            <CardForm decks={decks} />
          </section>
          <section aria-labelledby="import-cards" className="rounded-lg border bg-card p-5">
            <h2 id="import-cards" className="mb-2 text-lg font-semibold">Importar do Anki ou CSV</h2>
            <ImportCardsForm decks={decks} />
          </section>
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { previewIntervals, Rating, type CardRow, type Grade } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { reviewCard } from "../actions";

type Card = CardRow & { id: string; front: string; back: string; source: string };

const GRADES: { grade: Grade; label: string; key: string; className: string }[] = [
  { grade: Rating.Again, label: "Errei", key: "1", className: "border-destructive/40 hover:bg-destructive/10" },
  { grade: Rating.Hard, label: "Difícil", key: "2", className: "border-warn/50 hover:bg-warn/10" },
  { grade: Rating.Good, label: "Bom", key: "3", className: "border-primary/40 hover:bg-accent" },
  { grade: Rating.Easy, label: "Fácil", key: "4", className: "border-success/40 hover:bg-success/10" },
];

export function ReviewSession({ cards, deckName }: { cards: Card[]; deckName: string | null }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [pending, startTransition] = useTransition();
  const card = queue[0];

  const intervals = useMemo(() => (card ? previewIntervals(card) : null), [card]);

  const rate = useCallback(
    (grade: Grade) => {
      if (!card || pending) return;
      startTransition(async () => {
        try {
          const { due } = await reviewCard({ cardId: card.id, rating: grade });
          setQueue((q) => {
            const rest = q.slice(1);
            // Cartões em aprendizado que voltam em até 20 min reaparecem nesta sessão
            if (new Date(due).getTime() - Date.now() < 20 * 60_000) {
              return [...rest, { ...card, due, state: grade === Rating.Again ? 3 : 1 }];
            }
            return rest;
          });
          setDone((d) => d + 1);
          setRevealed(false);
        } catch {
          toast.error("Não foi possível salvar a revisão.");
        }
      });
    },
    [card, pending],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) rate(g.grade);
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          rate(Rating.Good);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, revealed, rate]);

  if (!card) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{done ? "Revisão do dia concluída" : "Nenhum cartão para agora"}</h1>
        <p className="mt-2 text-muted-foreground">
          {done ? `${done} revisões feitas. Os próximos cartões voltam no momento certo.` : "Volte mais tarde ou adicione cartões novos."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <LinkButton href="/flashcards" variant="outline">Ver decks</LinkButton>
          <LinkButton href="/estudos">Fazer questões</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>{deckName ?? "Todos os decks"}</span>
        <span className="num">{done} feitos · {queue.length} restantes</span>
      </div>

      <div
        className="min-h-72 rounded-xl border bg-card p-6 sm:p-10"
        role="button"
        tabIndex={0}
        aria-label={revealed ? "Cartão revelado" : "Mostrar resposta"}
        onClick={() => setRevealed(true)}
        onKeyDown={() => undefined}
      >
        {card.state === 0 && <span className="mb-3 inline-block rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">novo</span>}
        <p className="text-lg leading-relaxed whitespace-pre-line sm:text-xl">{card.front}</p>
        {revealed && (
          <>
            <hr className="my-6" />
            <p className="leading-relaxed whitespace-pre-line text-foreground/90">{card.back}</p>
          </>
        )}
      </div>

      {!revealed ? (
        <div className="mt-6 text-center">
          <Button size="lg" onClick={() => setRevealed(true)}>Mostrar resposta</Button>
          <p className="mt-2 text-xs text-muted-foreground">Tente lembrar antes. Espaço também revela.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              onClick={() => rate(g.grade)}
              disabled={pending}
              className={cn("rounded-lg border bg-card px-2 py-3 text-center transition-colors disabled:opacity-50", g.className)}
            >
              <span className="block font-medium">{g.label}</span>
              <span className="num block text-xs text-muted-foreground">
                {intervals ? formatDistanceStrict(intervals[g.grade], new Date(), { locale: ptBR }) : ""}
              </span>
              <span className="sr-only">tecla {g.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

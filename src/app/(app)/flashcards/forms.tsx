"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCard, createDeck, importCards, type FormState } from "./actions";

function useToastOnSuccess(state: FormState, formRef: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Salvo.");
      formRef.current?.reset();
    }
  }, [state, formRef]);
}

export function CardForm({ decks, defaultDeckId }: { decks: { id: string; name: string }[]; defaultDeckId?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createCard, {});
  const ref = useRef<HTMLFormElement>(null);
  useToastOnSuccess(state, ref);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label htmlFor="card-deck" className="field-label">Deck</label>
        <select id="card-deck" name="deckId" defaultValue={defaultDeckId} className="field">
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="card-front" className="field-label">Frente</label>
        <textarea id="card-front" name="front" rows={2} required className="field" placeholder="Pergunta, palavra ou conceito" />
      </div>
      <div>
        <label htmlFor="card-back" className="field-label">Verso</label>
        <textarea id="card-back" name="back" rows={3} required className="field" placeholder="Resposta com suas palavras" />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>Adicionar cartão</Button>
    </form>
  );
}

export function DeckForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createDeck, {});
  const ref = useRef<HTMLFormElement>(null);
  useToastOnSuccess(state, ref);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="deck-name" className="sr-only">Nome do deck</label>
      <input id="deck-name" name="name" required placeholder="Nome do novo deck" className="field" />
      <Button type="submit" variant="secondary" disabled={pending}>Criar deck</Button>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function ImportCardsForm({ decks }: { decks: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(importCards, {});
  const ref = useRef<HTMLFormElement>(null);
  useToastOnSuccess(state, ref);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">Uma linha por cartão: <code>frente;verso</code>. Também aceita o .txt exportado pelo Anki.</p>
      <select name="deckId" aria-label="Deck de destino" className="field">
        {decks.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <input type="file" name="file" accept=".csv,.txt,.tsv,text/plain" aria-label="Arquivo" className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" />
      <textarea name="text" rows={4} aria-label="Cartões" className="field font-mono text-xs" placeholder={"deadline;prazo final\nto follow up;dar retorno"} />
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="secondary" disabled={pending}>Importar</Button>
    </form>
  );
}

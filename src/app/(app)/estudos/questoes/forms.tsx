"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createQuestion, importQuestions, type CreateState, type ImportState } from "./actions";

type Subject = { id: string; label: string };

export function CreateQuestionForm({ subjects }: { subjects: Subject[] }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createQuestion, {});
  const [kind, setKind] = useState<"choice" | "truefalse">("choice");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Questão adicionada.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="q-subject" className="field-label">Assunto</label>
          <select id="q-subject" name="subjectId" required className="field">
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="q-kind" className="field-label">Tipo</label>
          <select id="q-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="field">
            <option value="choice">Múltipla escolha</option>
            <option value="truefalse">Certo ou errado</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="q-stem" className="field-label">Enunciado</label>
        <textarea id="q-stem" name="stem" rows={3} required className="field" />
      </div>
      {kind === "choice" ? (
        <fieldset className="space-y-2">
          <legend className="field-label">Alternativas (marque a(s) correta(s))</legend>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="checkbox" name="correct" value={i} aria-label={`Alternativa ${i + 1} correta`} className="size-4 accent-primary" />
              <input name="options" aria-label={`Alternativa ${i + 1}`} placeholder={`Alternativa ${String.fromCharCode(65 + i)}`} className="field" />
            </div>
          ))}
        </fieldset>
      ) : (
        <fieldset className="flex gap-6">
          <legend className="field-label">Gabarito</legend>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="correct" value="true" className="accent-primary" /> Certo</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="correct" value="false" className="accent-primary" /> Errado</label>
        </fieldset>
      )}
      <div>
        <label htmlFor="q-exp" className="field-label">Explicação</label>
        <textarea id="q-exp" name="explanation" rows={2} className="field" placeholder="Por que a resposta é essa? Você vai ler isso quando errar." />
      </div>
      <div>
        <label htmlFor="q-src" className="field-label">Fonte (opcional)</label>
        <input id="q-src" name="source" className="field" placeholder="Ex.: Cebraspe 2023, Dataprev — Analista" />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar questão"}</Button>
    </form>
  );
}

const EXAMPLE = `[
  {
    "subject": "psm-eventos",
    "stem": "Qual é o timebox da Daily Scrum?",
    "options": ["15 minutos", "30 minutos", "1 hora"],
    "correct": [0],
    "explanation": "A Daily Scrum tem 15 minutos.",
    "source": "Minha questão"
  },
  {
    "subject": "conc-redes",
    "stem": "O protocolo DNS usa a porta 53.",
    "correct": true,
    "explanation": "DNS usa a porta 53 (UDP e TCP).",
    "board": "Cebraspe",
    "year": 2024
  }
]`;

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importQuestions, {});

  useEffect(() => {
    if (state.imported) toast.success(`${state.imported} questões importadas.`);
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Envie um arquivo .json ou cole o conteúdo. <code>subject</code> aceita o código do assunto (ex.: <code>psm-eventos</code>) ou o nome. <code>correct</code> aceita índices (0 = A), letras ou true/false.
      </p>
      <input type="file" name="file" accept="application/json,.json" aria-label="Arquivo JSON" className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" />
      <label htmlFor="import-json" className="sr-only">JSON</label>
      <textarea id="import-json" name="json" rows={8} className="field font-mono text-xs" placeholder={EXAMPLE} />
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Importando…" : "Importar"}</Button>
    </form>
  );
}

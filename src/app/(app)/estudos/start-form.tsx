"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startSession, type StartState } from "./actions";

type Topic = { id: string; name: string; total: number };
type Preset = { id: string; name: string; question_count: number; duration_min: number; pass_pct: number };

const FILTERS = [
  { value: "weak", label: "Ainda não dominadas" },
  { value: "unseen", label: "Nunca vistas" },
  { value: "wrong", label: "Errei da última vez" },
  { value: "all", label: "Todas" },
];

export function StartForm({ examId, topics, presets }: { examId: string; topics: Topic[]; presets: Preset[] }) {
  const [state, action, pending] = useActionState<StartState, FormData>(startSession, {});
  const [mode, setMode] = useState<"practice" | "mock">("practice");
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "");
  const preset = presets.find((p) => p.id === presetId);

  return (
    <form action={action} className="space-y-4">
      <div role="radiogroup" aria-label="Modo" className="inline-flex rounded-md bg-muted p-1 text-sm">
        {(["practice", "mock"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            disabled={m === "mock" && presets.length === 0}
            className={cn(
              "rounded px-3 py-1.5 transition-colors disabled:opacity-40",
              mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground",
            )}
          >
            {m === "practice" ? "Praticar" : "Simulado"}
          </button>
        ))}
      </div>
      <input type="hidden" name="mode" value={mode} />

      {mode === "practice" ? (
        <>
          <fieldset>
            <legend className="field-label">Assuntos</legend>
            <p className="mb-2 text-xs text-muted-foreground">
              Marcar vários intercala os assuntos, o que fixa melhor do que estudar um de cada vez.
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {topics.length === 0 && <input type="hidden" name="subjectIds" value={examId} />}
              {topics.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="subjectIds" value={t.id} defaultChecked className="size-4 accent-primary" />
                  <span>{t.name}</span>
                  <span className="num text-xs text-muted-foreground">{t.total}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`count-${examId}`} className="field-label">Quantidade</label>
              <input id={`count-${examId}`} name="count" type="number" min={1} max={200} defaultValue={20} className="field num" />
            </div>
            <div>
              <label htmlFor={`filter-${examId}`} className="field-label">Quais questões</label>
              <select id={`filter-${examId}`} name="filter" defaultValue="weak" className="field">
                {FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="subjectIds" value={examId} />
          <input type="hidden" name="filter" value="all" />
          <input type="hidden" name="count" value={preset?.question_count ?? 20} />
          <div>
            <label htmlFor={`preset-${examId}`} className="field-label">Simulado</label>
            <select id={`preset-${examId}`} name="presetId" value={presetId} onChange={(e) => setPresetId(e.target.value)} className="field">
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {preset && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {preset.question_count} questões · {preset.duration_min} min · aprovação com {preset.pass_pct}%. Sem gabarito até o fim, como na prova.
              </p>
            )}
          </div>
        </>
      )}

      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Preparando…" : mode === "practice" ? "Começar prática" : "Começar simulado"}
      </Button>
    </form>
  );
}

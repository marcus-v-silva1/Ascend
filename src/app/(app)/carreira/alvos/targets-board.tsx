"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { ActionForm, Field } from "@/components/action-form";
import { formatDate, relativeDays } from "@/lib/dates";
import { DEFAULT_WEIGHTS, targetScore, type Weights } from "@/lib/targets";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";
import { deleteTarget, saveTarget } from "../actions";

export type Target = {
  id: string;
  track_id: string | null;
  kind: "concurso" | "country" | "company" | "certification";
  name: string;
  location: string | null;
  salary_text: string | null;
  compatibility: number | null;
  difficulty: number | null;
  salary_score: number | null;
  location_score: number | null;
  status: string;
  exam_date: string | null;
  url: string | null;
  notes: string | null;
};

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  compatibility: "Compatibilidade",
  difficulty: "Facilidade",
  salary_score: "Salário",
  location_score: "Localização",
};

const STORAGE = "glowup:target-weights";

function ScoreFields({ t }: { t?: Target }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Field label="Compatibilidade" name="compatibility" type="number" min={0} max={10} step={0.5} defaultValue={t?.compatibility} />
      <Field label="Dificuldade" name="difficulty" type="number" min={0} max={10} step={0.5} defaultValue={t?.difficulty} />
      <Field label="Salário" name="salary_score" type="number" min={0} max={10} step={0.5} defaultValue={t?.salary_score} />
      <Field label="Localização" name="location_score" type="number" min={0} max={10} step={0.5} defaultValue={t?.location_score} />
    </div>
  );
}

function TargetFields({ t, kind }: { t?: Target; kind: Target["kind"] }) {
  return (
    <>
      {t && <input type="hidden" name="id" value={t.id} />}
      <input type="hidden" name="kind" value={t?.kind ?? kind} />
      <input type="hidden" name="track_id" value={t?.track_id ?? ""} />
      <Field label="Nome" name="name" required defaultValue={t?.name} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Local" name="location" defaultValue={t?.location} />
        <Field label="Salário" name="salary_text" defaultValue={t?.salary_text} />
        <Field label="Status" name="status" required defaultValue={t?.status ?? "monitorando"} />
        <Field label="Data da prova" name="exam_date" type="date" defaultValue={t?.exam_date} />
      </div>
      <ScoreFields t={t} />
      <Field label="Link" name="url" type="url" defaultValue={t?.url} />
      <div>
        <label htmlFor={`notes-${t?.id ?? "new"}`} className="field-label">Notas</label>
        <textarea id={`notes-${t?.id ?? "new"}`} name="notes" rows={2} defaultValue={t?.notes ?? ""} className="field" />
      </div>
    </>
  );
}

export function TargetsBoard({ targets, kind, title }: { targets: Target[]; kind: Target["kind"]; title: string }) {
  const [stored, setStored] = useLocalStorage<Partial<Weights>>(STORAGE, {});
  const weights = useMemo(() => ({ ...DEFAULT_WEIGHTS, ...stored }), [stored]);
  const updateWeight = (key: keyof Weights, value: number) => setStored({ ...weights, [key]: value });

  const ranked = useMemo(
    () =>
      targets
        .map((t) => ({ t, score: targetScore(t, weights) }))
        .sort((a, b) => b.score - a.score),
    [targets, weights],
  );

  return (
    <section aria-label={title} className="space-y-4">
      <fieldset className="rounded-lg border bg-card p-4">
        <legend className="px-1 text-sm font-medium">Quanto pesa cada critério para você</legend>
        <div className="grid gap-4 sm:grid-cols-4">
          {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((key) => (
            <label key={key} className="text-sm">
              <span className="flex justify-between">
                {WEIGHT_LABELS[key]}
                <span className="num text-muted-foreground">{Math.round(weights[key] * 100)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weights[key]}
                onChange={(e) => updateWeight(key, Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <ol className="space-y-2">
        {ranked.map(({ t, score }, i) => (
          <li key={t.id} className="rounded-lg border bg-card">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3">
                <span className="num w-6 text-right text-sm text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[t.location, t.salary_text, t.status].filter(Boolean).join(" · ")}
                    {t.exam_date && (
                      <span className="text-warn"> · prova {formatDate(t.exam_date, true)} ({relativeDays(t.exam_date)})</span>
                    )}
                  </p>
                </div>
                <div className="hidden gap-3 text-center text-xs sm:flex" aria-hidden>
                  {(["compatibility", "difficulty", "salary_score", "location_score"] as const).map((k) => (
                    <span key={k} className="num w-9 text-muted-foreground" title={WEIGHT_LABELS[k]}>
                      {t[k] ?? "—"}
                    </span>
                  ))}
                </div>
                <span
                  className={cn("num w-12 text-right text-lg font-semibold", score >= 8 ? "text-success" : score >= 6.5 ? "text-foreground" : "text-muted-foreground")}
                  style={{ fontFamily: "var(--font-sora)" }}
                  aria-label={`Nota ${score}`}
                >
                  {score.toFixed(1)}
                </span>
              </summary>
              <div className="border-t px-4 py-4">
                {t.notes && <p className="mb-3 text-sm text-muted-foreground">{t.notes}</p>}
                {t.url && (
                  <a href={t.url} target="_blank" rel="noreferrer" className="mb-4 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline">
                    Abrir página <ExternalLink className="size-3" aria-hidden />
                  </a>
                )}
                <ActionForm action={saveTarget} submitLabel="Salvar alterações" resetOnSuccess={false}>
                  <TargetFields t={t} kind={kind} />
                </ActionForm>
                <form action={deleteTarget} className="mt-3">
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">Excluir</button>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ol>

      <details className="rounded-lg border border-dashed p-4">
        <summary className="cursor-pointer text-sm font-medium">Adicionar {kind === "country" ? "país ou rota de visto" : "concurso"}</summary>
        <ActionForm action={saveTarget} submitLabel="Adicionar" className="mt-3 space-y-3">
          <TargetFields kind={kind} />
        </ActionForm>
      </details>
    </section>
  );
}

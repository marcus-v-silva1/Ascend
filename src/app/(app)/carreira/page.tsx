import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatDate, localDate, relativeDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  bumpKeyResult,
  createGoal,
  createKeyResult,
  createMilestone,
  deleteMilestone,
  setGoalStatus,
  toggleMilestone,
  updateIntention,
} from "./actions";

export const metadata: Metadata = { title: "Carreira" };

type Track = { id: string; external_id: string | null; name: string; description: string | null; color: string | null };
type KR = { id: string; goal_id: string; title: string; current_value: number; target_value: number; unit: string | null; position: number };
type Goal = {
  id: string;
  track_id: string | null;
  title: string;
  description: string | null;
  implementation_intention: string | null;
  target_date: string | null;
  status: "active" | "done" | "paused" | "dropped";
  position: number;
};
type Milestone = { id: string; track_id: string | null; title: string; notes: string | null; due_date: string | null; done_at: string | null };

const STATUS_LABEL: Record<Goal["status"], string> = { active: "Ativa", done: "Concluída", paused: "Pausada", dropped: "Abandonada" };

export default async function CareerPage({ searchParams }: PageProps<"/carreira">) {
  const sp = await searchParams;
  const trackFilter = typeof sp.trilha === "string" ? sp.trilha : undefined;
  const { supabase } = await requireUser();

  const [{ data: tracksData }, { data: goalsData }, { data: krsData }, { data: msData }] = await Promise.all([
    supabase.from("tracks").select("id, external_id, name, description, color").order("position"),
    supabase.from("goals").select("id, track_id, title, description, implementation_intention, target_date, status, position").order("position"),
    supabase.from("key_results").select("id, goal_id, title, current_value, target_value, unit, position").order("position"),
    supabase.from("milestones").select("id, track_id, title, notes, due_date, done_at").order("due_date", { nullsFirst: false }),
  ]);
  const tracks = (tracksData ?? []) as Track[];
  const currentTrack = tracks.find((t) => t.id === trackFilter);
  const goals = ((goalsData ?? []) as Goal[]).filter((g) => !trackFilter || g.track_id === trackFilter);
  const krs = (krsData ?? []) as KR[];
  const milestones = ((msData ?? []) as Milestone[]).filter((m) => !trackFilter || m.track_id === trackFilter);
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const today = localDate();

  const goalProgress = (goalId: string) => {
    const list = krs.filter((k) => k.goal_id === goalId);
    if (!list.length) return null;
    const avg = list.reduce((s, k) => s + Math.min(1, Number(k.current_value) / Number(k.target_value)), 0) / list.length;
    return Math.round(avg * 100);
  };

  const ordered = [...goals].sort((a, b) => {
    const rank = (g: Goal) => (g.status === "active" ? 0 : g.status === "paused" ? 1 : 2);
    return rank(a) - rank(b) || (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999");
  });

  return (
    <>
      <PageHeader
        title={currentTrack?.name ?? "Plano de carreira"}
        description={currentTrack?.description ?? "Metas com resultados-chave mensuráveis e um gatilho concreto: quando X acontecer, faço Y."}
      />

      <nav aria-label="Filtrar por trilha" className="mb-6 flex flex-wrap gap-2">
        <Link href="/carreira" className={cn("rounded-full border px-3 py-1 text-sm", !trackFilter ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground")}>
          Todas
        </Link>
        {tracks.map((t) => (
          <Link
            key={t.id}
            href={`/carreira?trilha=${t.id}`}
            className={cn("flex items-center gap-2 rounded-full border px-3 py-1 text-sm", trackFilter === t.id ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground")}
          >
            <span className="size-2 rounded-full" style={{ background: t.color ?? "currentColor" }} aria-hidden />
            {t.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-label="Metas" className="space-y-4">
          {ordered.map((g) => {
            const progress = goalProgress(g.id);
            const track = g.track_id ? trackById.get(g.track_id) : undefined;
            const goalKrs = krs.filter((k) => k.goal_id === g.id);
            const overdue = g.status === "active" && g.target_date && g.target_date < today;
            return (
              <article key={g.id} className={cn("rounded-lg border bg-card p-5", g.status !== "active" && "opacity-70")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {track && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: track.color ?? "currentColor" }} aria-hidden />
                        {track.name}
                      </p>
                    )}
                    <h2 className="text-lg font-semibold">{g.title}</h2>
                    {g.target_date && (
                      <p className={cn("text-sm", overdue ? "text-destructive" : "text-muted-foreground")}>
                        Prazo {formatDate(g.target_date)} · {relativeDays(g.target_date)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {progress !== null && <span className="num text-2xl font-semibold" style={{ fontFamily: "var(--font-sora)" }}>{progress}%</span>}
                    <form action={setGoalStatus} className="flex items-center">
                      <input type="hidden" name="id" value={g.id} />
                      <label htmlFor={`st-${g.id}`} className="sr-only">Status</label>
                      <select id={`st-${g.id}`} name="status" defaultValue={g.status} className="field h-8 w-auto py-1 text-xs">
                        {Object.entries(STATUS_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <button type="submit" className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Salvar status">
                        <Check className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {g.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.description}</p>}

                <form action={updateIntention} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={g.id} />
                  <label htmlFor={`ii-${g.id}`} className="sr-only">Gatilho</label>
                  <input
                    id={`ii-${g.id}`}
                    name="implementation_intention"
                    defaultValue={g.implementation_intention ?? ""}
                    placeholder="Quando… então eu…"
                    className="field border-dashed bg-transparent text-sm italic"
                  />
                  <button type="submit" className="shrink-0 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">Salvar</button>
                </form>

                {goalKrs.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {goalKrs.map((k) => {
                      const pct = Math.min(100, Math.round((Number(k.current_value) / Number(k.target_value)) * 100));
                      return (
                        <li key={k.id}>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className={pct >= 100 ? "text-muted-foreground line-through" : undefined}>{k.title}</span>
                            <div className="flex shrink-0 items-center gap-1">
                              <form action={bumpKeyResult}>
                                <input type="hidden" name="id" value={k.id} />
                                <input type="hidden" name="delta" value={-1} />
                                <button type="submit" className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Diminuir ${k.title}`}><Minus className="size-3.5" /></button>
                              </form>
                              <span className="num min-w-16 text-center text-xs text-muted-foreground">
                                {Number(k.current_value)}/{Number(k.target_value)}{k.unit ? ` ${k.unit}` : ""}
                              </span>
                              <form action={bumpKeyResult}>
                                <input type="hidden" name="id" value={k.id} />
                                <input type="hidden" name="delta" value={1} />
                                <button type="submit" className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Aumentar ${k.title}`}><Plus className="size-3.5" /></button>
                              </form>
                            </div>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className={cn("h-full rounded-full", pct >= 100 ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Adicionar resultado-chave</summary>
                  <ActionForm action={createKeyResult} submitLabel="Adicionar" submitVariant="secondary" className="mt-3 grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end">
                    <input type="hidden" name="goal_id" value={g.id} />
                    <Field label="Resultado-chave" name="title" required />
                    <Field label="Alvo" name="target_value" type="number" min={1} step="any" required />
                    <Field label="Unidade" name="unit" />
                  </ActionForm>
                </details>
              </article>
            );
          })}
          {ordered.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Nenhuma meta nesta trilha. Crie a primeira ao lado.</p>}
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="ms">
            <h2 id="ms" className="mb-3 text-lg font-semibold">Marcos</h2>
            <ol className="relative space-y-1 border-l pl-5">
              {milestones.map((m) => {
                const done = Boolean(m.done_at);
                const late = !done && m.due_date && m.due_date < today;
                return (
                  <li key={m.id} className="group relative py-1.5">
                    <form action={toggleMilestone} className="absolute top-2 -left-[1.95rem]">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="done" value={String(done)} />
                      <button
                        type="submit"
                        aria-label={done ? `Reabrir ${m.title}` : `Concluir ${m.title}`}
                        className={cn("grid size-5 place-items-center rounded-full border-2 bg-background", done ? "border-success bg-success text-white" : late ? "border-destructive" : "border-primary")}
                      >
                        {done && <Check className="size-3" />}
                      </button>
                    </form>
                    <p className={cn("text-sm", done && "text-muted-foreground line-through")}>{m.title}</p>
                    <p className={cn("text-xs", late ? "text-destructive" : "text-muted-foreground")}>
                      {m.due_date ? `${formatDate(m.due_date)} · ${relativeDays(m.due_date)}` : "sem data"}
                      {m.notes && ` · ${m.notes}`}
                    </p>
                    <form action={deleteMilestone} className="absolute top-1.5 right-0 hidden group-hover:block">
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">excluir</button>
                    </form>
                  </li>
                );
              })}
            </ol>
            <details className="mt-4 rounded-lg border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">Novo marco</summary>
              <ActionForm action={createMilestone} submitLabel="Adicionar marco" className="mt-3 space-y-3">
                <Field label="O que vai acontecer" name="title" required />
                <Field label="Data" name="due_date" type="date" />
                <div>
                  <label htmlFor="ms-track" className="field-label">Trilha</label>
                  <select id="ms-track" name="track_id" defaultValue={trackFilter ?? ""} className="field">
                    <option value="">Nenhuma</option>
                    {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </ActionForm>
            </details>
          </section>

          <section aria-labelledby="new-goal" className="rounded-lg border bg-card p-5">
            <h2 id="new-goal" className="mb-4 text-lg font-semibold">Nova meta</h2>
            <ActionForm action={createGoal} submitLabel="Criar meta">
              <Field label="Meta" name="title" required placeholder="Ex.: Passar no ISTQB CTFL" />
              <div>
                <label htmlFor="g-track" className="field-label">Trilha</label>
                <select id="g-track" name="track_id" defaultValue={trackFilter ?? ""} className="field">
                  <option value="">Nenhuma</option>
                  {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <Field label="Prazo" name="target_date" type="date" />
              <Field label="Gatilho (quando… farei…)" name="implementation_intention" placeholder="Quando acordar, faço 20 questões antes do celular." />
              <div>
                <label htmlFor="g-desc" className="field-label">Por que isso importa</label>
                <textarea id="g-desc" name="description" rows={2} className="field" />
              </div>
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}

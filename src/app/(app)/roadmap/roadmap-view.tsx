"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleCheck, CircleDashed, CircleDot, Lock, Plus, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { AscendMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { RoadmapStatus } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { addTopic, deleteTopic, saveNodeNotes, setNodeStatus } from "./actions";

export type ViewNode = {
  id: string;
  external_id: string;
  parent_external_id: string | null;
  kind: "goal" | "stage" | "topic";
  title: string;
  description: string | null;
  side: string | null;
  position: number;
  status: RoadmapStatus | null;
  link_type: string;
  requires: string[];
  resources: { title: string; url: string }[];
  app_href: string | null;
  notes: string | null;
  pct: number;
  effective: RoadmapStatus;
  auto: boolean;
  blockedBy: string[];
};

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  done: "Feito",
  doing: "Fazendo",
  todo: "A fazer",
  skipped: "Pulado",
};

const LINK_LABEL: Record<string, string> = {
  subject: "questões dominadas do assunto",
  goal: "resultados-chave da meta",
  key_result: "resultado-chave da meta",
  milestone: "marco concluído",
  english_unit: "progresso na Times",
  fund: "reserva acumulada",
};

function StatusIcon({ node, className }: { node: ViewNode; className?: string }) {
  const c = cn("size-4 shrink-0", className);
  if (node.effective === "done") return <CircleCheck className={cn(c, "text-success")} aria-hidden />;
  if (node.effective === "doing") return <CircleDot className={cn(c, "text-summit")} aria-hidden />;
  if (node.effective === "skipped") return <SkipForward className={cn(c, "text-muted-foreground")} aria-hidden />;
  if (node.blockedBy.length) return <Lock className={cn(c, "text-muted-foreground")} aria-hidden />;
  return <CircleDashed className={cn(c, "text-muted-foreground")} aria-hidden />;
}

function TopicCard({ node, onSelect, align }: { node: ViewNode; onSelect: (id: string) => void; align: "left" | "right" }) {
  const blocked = node.effective === "todo" && node.blockedBy.length > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(node.external_id)}
      aria-label={`${node.title}: ${STATUS_LABEL[node.effective]}${blocked ? ", aguardando pré-requisitos" : ""}`}
      className={cn(
        "group relative flex w-full max-w-64 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        // conector tracejado até a linha da etapa
        "lg:after:absolute lg:after:top-1/2 lg:after:w-5 lg:after:border-t-2 lg:after:border-dashed lg:after:border-primary/25",
        align === "left" ? "lg:after:left-full" : "lg:after:right-full",
        node.effective === "done" && "border-success/40 bg-success/10",
        node.effective === "doing" && "border-summit/70 bg-summit/10",
        node.effective === "todo" && "border-border bg-card hover:border-primary/50",
        node.effective === "skipped" && "border-dashed bg-transparent opacity-60",
        blocked && "opacity-70",
      )}
    >
      <StatusIcon node={node} />
      <span className={cn("flex-1", node.effective === "done" && "line-through decoration-success/50")}>{node.title}</span>
      {node.effective === "doing" && node.auto && <span className="num text-xs text-muted-foreground">{node.pct}%</span>}
    </button>
  );
}

function StageCard({ node, onSelect }: { node: ViewNode; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.external_id)}
      className={cn(
        "relative w-full rounded-lg bg-ink px-4 py-3 text-left text-white shadow-sm ring-2 transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-sidebar-ring",
        node.effective === "done" ? "ring-success" : node.effective === "doing" ? "ring-summit/70" : "ring-transparent",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-[family-name:var(--font-sora)] font-semibold tracking-[-0.01em]">{node.title}</span>
        <span className="num text-xs text-white/60">{node.pct}%</span>
      </span>
      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <span className={cn("block h-full rounded-full", node.effective === "done" ? "bg-success" : "bg-summit")} style={{ width: `${node.pct}%` }} />
      </span>
    </button>
  );
}

function NodePanel({
  node,
  all,
  roadmap,
  onSelect,
}: {
  node: ViewNode;
  all: Map<string, ViewNode>;
  roadmap: string;
  onSelect: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(node.notes ?? "");
  const [newTopic, setNewTopic] = useState("");
  const [side, setSide] = useState<"left" | "right">("right");

  const setStatus = (status: RoadmapStatus | null) =>
    startTransition(async () => {
      try {
        await setNodeStatus({ id: node.id, status });
      } catch {
        toast.error("Não foi possível salvar.");
      }
    });

  const options: { value: RoadmapStatus | null; label: string }[] = [
    ...(node.link_type !== "none" || node.kind !== "topic" ? [{ value: null, label: "Automático" }] : []),
    { value: "todo", label: "A fazer" },
    { value: "doing", label: "Fazendo" },
    { value: "done", label: "Feito" },
    { value: "skipped", label: "Pular" },
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-8">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <StatusIcon node={node} />
            {STATUS_LABEL[node.effective]}
            {node.auto && node.link_type !== "none" && <span className="text-muted-foreground">· automático</span>}
          </span>
          <span className="num text-muted-foreground">{node.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className={cn("h-full rounded-full", node.effective === "done" ? "bg-success" : "bg-primary")} style={{ width: `${node.pct}%` }} />
        </div>
        {node.link_type !== "none" && (
          <p className="mt-1.5 text-xs text-muted-foreground">Calculado a partir de: {LINK_LABEL[node.link_type]}.</p>
        )}
      </div>

      <fieldset>
        <legend className="field-label">Marcar como</legend>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const active = o.value === null ? node.status === null : node.status === o.value;
            return (
              <button
                key={o.label}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={() => setStatus(o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-50",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {node.blockedBy.length > 0 && (
        <div>
          <p className="field-label">Antes, conclua</p>
          <ul className="space-y-1">
            {node.blockedBy.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onSelect(id)} className="flex items-center gap-1.5 text-sm underline-offset-4 hover:underline">
                  <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                  {all.get(id)?.title ?? id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.resources.length > 0 && (
        <div>
          <p className="field-label">Onde estudar</p>
          <ul className="space-y-1">
            {node.resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                  {r.title}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.app_href && (
        <Link href={node.app_href} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80">
          Abrir no Ascend
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await saveNodeNotes({ id: node.id, notes });
            toast.success("Anotações salvas.");
          });
        }}
        className="space-y-2"
      >
        <label htmlFor={`notes-${node.id}`} className="field-label">Anotações</label>
        <textarea id={`notes-${node.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="field" placeholder="Links, dúvidas, o que falta…" />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>Salvar anotações</Button>
      </form>

      {node.kind === "stage" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await addTopic({ roadmap, parent: node.external_id, title: newTopic, side });
              if (res.error) toast.error(res.error);
              else {
                setNewTopic("");
                toast.success("Tópico adicionado.");
              }
            });
          }}
          className="space-y-2 border-t pt-6"
        >
          <label htmlFor="new-topic" className="field-label">Novo tópico nesta etapa</label>
          <input id="new-topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="field" placeholder="Ex.: Cypress, Postman, k6…" />
          <div className="flex items-center gap-3">
            <select value={side} onChange={(e) => setSide(e.target.value as "left" | "right")} aria-label="Lado" className="field w-auto">
              <option value="left">À esquerda</option>
              <option value="right">À direita</option>
            </select>
            <Button type="submit" size="sm" disabled={pending || newTopic.trim().length < 2}>
              <Plus aria-hidden /> Adicionar
            </Button>
          </div>
        </form>
      )}

      {node.external_id.startsWith("custom-") && (
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await deleteTopic({ id: node.id });
              onSelect("");
            })
          }
          className="text-sm text-muted-foreground hover:text-destructive"
        >
          Remover este tópico
        </button>
      )}
    </div>
  );
}

export function RoadmapView({ nodes, roadmap }: { nodes: ViewNode[]; roadmap: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.external_id, n])), [nodes]);
  const stages = nodes.filter((n) => n.kind === "stage").sort((a, b) => a.position - b.position);
  const goal = nodes.find((n) => n.kind === "goal");
  const current = selected ? byId.get(selected) : undefined;

  const topicsOf = (stageId: string) => {
    const list = nodes.filter((n) => n.kind === "topic" && n.parent_external_id === stageId).sort((a, b) => a.position - b.position);
    const left: ViewNode[] = [];
    const right: ViewNode[] = [];
    list.forEach((t, i) => ((t.side ?? (i % 2 ? "right" : "left")) === "left" ? left : right).push(t));
    return { left, right };
  };

  return (
    <>
      <div className="relative mx-auto max-w-5xl pb-4">
        {/* Espinha */}
        <div className="absolute top-0 bottom-0 left-5 border-l-2 border-dashed border-primary/30 lg:left-1/2" aria-hidden />

        <ol className="relative space-y-2">
          {stages.map((stage, i) => {
            const { left, right } = topicsOf(stage.external_id);
            return (
              <li key={stage.id} className="grid items-center gap-x-5 gap-y-2 py-5 pl-10 lg:grid-cols-[1fr_16rem_1fr] lg:pl-0">
                {/* Ordem no HTML: etapa, esquerda, direita (leitura natural); o grid posiciona no desktop */}
                <div className="lg:col-start-2 lg:row-start-1">
                  <p className="mb-1 text-xs text-muted-foreground lg:text-center">Etapa {i + 1}</p>
                  <StageCard node={stage} onSelect={setSelected} />
                </div>
                <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-1 lg:items-end">
                  {left.map((t) => <TopicCard key={t.id} node={t} onSelect={setSelected} align="left" />)}
                </div>
                <div className="flex flex-col gap-2 lg:col-start-3 lg:row-start-1 lg:items-start">
                  {right.map((t) => <TopicCard key={t.id} node={t} onSelect={setSelected} align="right" />)}
                </div>
              </li>
            );
          })}
        </ol>

        {goal && (
          <div className="relative flex justify-start pt-6 pl-10 lg:justify-center lg:pl-0">
            <button
              type="button"
              onClick={() => setSelected(goal.external_id)}
              className={cn(
                "relative flex w-full max-w-md items-center gap-4 rounded-xl border-2 bg-card p-5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                goal.effective === "done" ? "border-success" : "border-summit",
              )}
            >
              <AscendMark className="size-12 shrink-0 text-ink dark:text-white" />
              <span>
                <span className="block text-xs text-muted-foreground">Objetivo</span>
                <span className="block font-[family-name:var(--font-sora)] text-xl font-semibold tracking-[-0.02em]">{goal.title}</span>
                {goal.description && <span className="block text-sm text-muted-foreground">{goal.description}</span>}
              </span>
            </button>
          </div>
        )}
      </div>

      <Sheet open={!!current} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          {current && (
            <>
              <SheetHeader>
                <p className="text-xs text-muted-foreground">
                  {current.kind === "stage" ? "Etapa" : current.kind === "goal" ? "Objetivo" : byId.get(current.parent_external_id ?? "")?.title}
                </p>
                <SheetTitle className="font-[family-name:var(--font-sora)] text-xl">{current.title}</SheetTitle>
                {current.description && <SheetDescription>{current.description}</SheetDescription>}
              </SheetHeader>
              <NodePanel key={current.id} node={current} all={byId} roadmap={roadmap} onSelect={(id) => setSelected(id || null)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function NextStepsList({ steps, nodes }: { steps: { external_id: string; title: string; effective: RoadmapStatus }[]; nodes: ViewNode[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {steps.map((s) => {
        const node = nodes.find((n) => n.external_id === s.external_id);
        return (
          <li key={s.external_id} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm">
            {node && <StatusIcon node={node} className="size-3.5" />}
            {s.title}
          </li>
        );
      })}
    </ul>
  );
}

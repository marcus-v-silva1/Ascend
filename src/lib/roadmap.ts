export type RoadmapStatus = "todo" | "doing" | "done" | "skipped";
export type LinkType = "subject" | "goal" | "key_result" | "milestone" | "english_unit" | "fund" | "none";

export type RoadmapNodeInput = {
  external_id: string;
  parent_external_id: string | null;
  kind: "goal" | "stage" | "topic";
  status: RoadmapStatus | null;
  link_type: LinkType;
  link_ref: string | null;
  requires: string[];
  position: number;
};

/** Progresso (0–100) de cada coisa do app que um nó pode referenciar, por id externo. */
export type ProgressContext = {
  subject: Map<string, number>;
  goal: Map<string, number>;
  key_result: Map<string, number>;
  milestone: Map<string, number>;
  english_unit: Map<string, number>;
  fund: Map<string, number>;
};

export type ComputedNode<T extends RoadmapNodeInput> = T & {
  pct: number;
  effective: RoadmapStatus;
  auto: boolean;
  /** Pré-requisitos ainda não concluídos */
  blockedBy: string[];
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function statusFromPct(pct: number): RoadmapStatus {
  if (pct >= 100) return "done";
  if (pct > 0) return "doing";
  return "todo";
}

function linkedPct(node: RoadmapNodeInput, ctx: ProgressContext): number | null {
  if (node.link_type === "none" || !node.link_ref) return null;
  const value = ctx[node.link_type].get(node.link_ref);
  return value === undefined ? null : clamp(value);
}

/**
 * Calcula progresso e status efetivo de cada nó.
 * Ordem de prioridade: status manual > item vinculado > média dos filhos (etapas) > a fazer.
 * Nós "pulados" não entram na média da etapa.
 */
export function computeRoadmap<T extends RoadmapNodeInput>(nodes: T[], ctx: ProgressContext): ComputedNode<T>[] {
  const children = new Map<string, T[]>();
  for (const n of nodes) {
    if (!n.parent_external_id) continue;
    children.set(n.parent_external_id, [...(children.get(n.parent_external_id) ?? []), n]);
  }

  const memo = new Map<string, { pct: number; effective: RoadmapStatus; auto: boolean }>();
  const resolve = (n: T): { pct: number; effective: RoadmapStatus; auto: boolean } => {
    const cached = memo.get(n.external_id);
    if (cached) return cached;

    let pct = linkedPct(n, ctx);
    if (pct === null) {
      const kids = (children.get(n.external_id) ?? []).map(resolve).filter((k) => k.effective !== "skipped");
      pct = kids.length ? clamp(kids.reduce((s, k) => s + (k.effective === "done" ? 100 : k.pct), 0) / kids.length) : 0;
    }

    let result: { pct: number; effective: RoadmapStatus; auto: boolean };
    if (n.status) {
      result = { pct: n.status === "done" ? 100 : pct, effective: n.status, auto: false };
    } else {
      result = { pct, effective: statusFromPct(pct), auto: true };
    }
    memo.set(n.external_id, result);
    return result;
  };

  const byId = new Map(nodes.map((n) => [n.external_id, n]));
  return nodes.map((n) => {
    const r = resolve(n);
    const blockedBy = n.requires.filter((req) => {
      const dep = byId.get(req);
      if (!dep) return false;
      const s = resolve(dep).effective;
      return s !== "done" && s !== "skipped";
    });
    return { ...n, ...r, blockedBy };
  });
}

/** Resumo do roadmap: tópicos concluídos sobre o total (sem contar os pulados). */
export function roadmapSummary(nodes: { kind: string; effective: RoadmapStatus }[]) {
  const topics = nodes.filter((n) => n.kind === "topic" && n.effective !== "skipped");
  const done = topics.filter((n) => n.effective === "done").length;
  return { done, total: topics.length, pct: topics.length ? Math.round((done / topics.length) * 100) : 0 };
}

/** Próximos passos: tópicos não concluídos e desbloqueados, na ordem do roadmap. */
export function nextSteps<T extends RoadmapNodeInput>(nodes: ComputedNode<T>[], limit = 3) {
  const order = new Map(nodes.filter((n) => n.kind === "stage").map((n) => [n.external_id, n.position]));
  return nodes
    .filter((n) => n.kind === "topic" && (n.effective === "todo" || n.effective === "doing") && n.blockedBy.length === 0)
    .sort(
      (a, b) =>
        (a.effective === "doing" ? 0 : 1) - (b.effective === "doing" ? 0 : 1) ||
        (order.get(a.parent_external_id ?? "") ?? 0) - (order.get(b.parent_external_id ?? "") ?? 0) ||
        a.position - b.position,
    )
    .slice(0, limit);
}

import { describe, expect, it } from "vitest";
import { ROADMAP_NODES } from "@/content/roadmap";
import { SUBJECTS } from "@/content/subjects";
import { GOALS, MILESTONES, FUNDS } from "@/content/plan";
import { computeRoadmap, nextSteps, roadmapSummary, statusFromPct, type ProgressContext, type RoadmapNodeInput } from "@/lib/roadmap";

const emptyCtx = (): ProgressContext => ({
  subject: new Map(),
  goal: new Map(),
  key_result: new Map(),
  milestone: new Map(),
  english_unit: new Map(),
  fund: new Map(),
});

const node = (id: string, extra: Partial<RoadmapNodeInput> = {}): RoadmapNodeInput => ({
  external_id: id,
  parent_external_id: null,
  kind: "topic",
  status: null,
  link_type: "none",
  link_ref: null,
  requires: [],
  position: 0,
  ...extra,
});

describe("statusFromPct", () => {
  it("0 a fazer, parcial fazendo, 100 feito", () => {
    expect(statusFromPct(0)).toBe("todo");
    expect(statusFromPct(40)).toBe("doing");
    expect(statusFromPct(100)).toBe("done");
  });
});

describe("computeRoadmap", () => {
  it("usa o progresso do item vinculado", () => {
    const ctx = emptyCtx();
    ctx.english_unit.set("book-2", 75);
    const [n] = computeRoadmap([node("en", { link_type: "english_unit", link_ref: "book-2" })], ctx);
    expect(n.pct).toBe(75);
    expect(n.effective).toBe("doing");
    expect(n.auto).toBe(true);
  });

  it("status manual vence o automático", () => {
    const ctx = emptyCtx();
    ctx.goal.set("g", 10);
    const [n] = computeRoadmap([node("x", { link_type: "goal", link_ref: "g", status: "done" })], ctx);
    expect(n.effective).toBe("done");
    expect(n.pct).toBe(100);
    expect(n.auto).toBe(false);
  });

  it("etapa sem vínculo é a média dos filhos, ignorando pulados", () => {
    const nodes = [
      node("s", { kind: "stage" }),
      node("a", { parent_external_id: "s", status: "done" }),
      node("b", { parent_external_id: "s" }),
      node("c", { parent_external_id: "s", status: "skipped" }),
    ];
    const stage = computeRoadmap(nodes, emptyCtx()).find((n) => n.external_id === "s")!;
    expect(stage.pct).toBe(50);
    expect(stage.effective).toBe("doing");
  });

  it("marca pré-requisitos pendentes", () => {
    const nodes = [node("a"), node("b", { requires: ["a"] }), node("c", { requires: ["d"] }), node("d", { status: "done" })];
    const out = computeRoadmap(nodes, emptyCtx());
    expect(out.find((n) => n.external_id === "b")!.blockedBy).toEqual(["a"]);
    expect(out.find((n) => n.external_id === "c")!.blockedBy).toEqual([]);
  });

  it("vínculo sem dado no contexto conta como 0", () => {
    const [n] = computeRoadmap([node("x", { link_type: "subject", link_ref: "nao-existe" })], emptyCtx());
    expect(n.pct).toBe(0);
    expect(n.effective).toBe("todo");
  });
});

describe("resumo e próximos passos", () => {
  it("conta só tópicos e prioriza o que está em andamento", () => {
    const nodes = computeRoadmap(
      [
        node("s1", { kind: "stage", position: 0 }),
        node("t1", { parent_external_id: "s1", status: "done" }),
        node("t2", { parent_external_id: "s1", position: 1 }),
        node("t3", { parent_external_id: "s1", position: 2, status: "doing" }),
        node("t4", { parent_external_id: "s1", position: 3, requires: ["t2"] }),
      ],
      emptyCtx(),
    );
    expect(roadmapSummary(nodes)).toEqual({ done: 1, total: 4, pct: 25 });
    expect(nextSteps(nodes).map((n) => n.external_id)).toEqual(["t3", "t2"]);
  });
});

describe("conteúdo do roadmap", () => {
  const ids = new Set(ROADMAP_NODES.map((n) => n.id));
  const subjects = new Set(SUBJECTS.map((s) => s.id));
  const goals = new Set(GOALS.map((g) => g.external_id));
  const krs = new Set(GOALS.flatMap((g) => g.krs.map((k) => k.external_id)));
  const milestones = new Set(MILESTONES.map((m) => m.external_id));
  const funds = new Set(FUNDS.map((f) => f.external_id));

  it("ids únicos, pais e pré-requisitos existem", () => {
    expect(ids.size).toBe(ROADMAP_NODES.length);
    for (const n of ROADMAP_NODES) {
      if (n.parent) expect(ids, n.id).toContain(n.parent);
      for (const r of n.requires ?? []) expect(ids, `${n.id} requer ${r}`).toContain(r);
      if (n.kind === "topic") expect(n.parent, n.id).toBeDefined();
    }
  });

  it("vínculos apontam para itens existentes", () => {
    for (const n of ROADMAP_NODES) {
      if (!n.link) continue;
      const set = { subject: subjects, goal: goals, key_result: krs, milestone: milestones, fund: funds, english_unit: null }[n.link.type];
      if (set) expect(set, `${n.id} → ${n.link.ref}`).toContain(n.link.ref);
    }
  });

  it("cada roadmap termina num objetivo", () => {
    for (const r of ["europa", "concursos"]) {
      expect(ROADMAP_NODES.filter((n) => n.roadmap === r && n.kind === "goal")).toHaveLength(1);
    }
  });
});

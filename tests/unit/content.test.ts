import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DECKS } from "@/content/decks";
import { GOALS, MILESTONES, PLANNED_COSTS, TARGETS, TASKS, TRACKS } from "@/content/plan";
import { COBIT_QUESTIONS, ITIL_QUESTIONS } from "@/content/questions/cobit-itil";
import { CONCURSO_QUESTIONS, ISTQB_QUESTIONS } from "@/content/questions/istqb-concursos";
import { PSM_QUESTIONS } from "@/content/questions/psm";
import { PRESETS, SUBJECTS } from "@/content/subjects";
import { toQuestionRow } from "@/content/types";
import { parseImport } from "@/lib/question-import";

const QUESTIONS = [...PSM_QUESTIONS, ...COBIT_QUESTIONS, ...ITIL_QUESTIONS, ...ISTQB_QUESTIONS, ...CONCURSO_QUESTIONS];
const subjectIds = new Set(SUBJECTS.map((s) => s.id));
const trackIds = new Set(TRACKS.map((t) => t.external_id));
const goalIds = new Set(GOALS.map((g) => g.external_id));

function expectUnique(ids: string[]) {
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  expect(dupes).toEqual([]);
}

describe("conteúdo semente", () => {
  it("ids são únicos em cada coleção", () => {
    expectUnique(SUBJECTS.map((s) => s.id));
    expectUnique(QUESTIONS.map((q) => q.id));
    expectUnique(DECKS.map((d) => d.id));
    expectUnique(DECKS.flatMap((d) => d.cards.map((c) => c.id)));
    expectUnique(GOALS.map((g) => g.external_id));
    expectUnique(GOALS.flatMap((g) => g.krs.map((k) => k.external_id)));
    expectUnique(TARGETS.map((t) => t.external_id));
  });

  it("assuntos-pai existem", () => {
    for (const s of SUBJECTS) if (s.parent) expect(subjectIds, s.id).toContain(s.parent);
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))("questão %s é válida", (_id, q) => {
    expect(subjectIds).toContain(q.subject);
    expect(q.stem.length).toBeGreaterThan(10);
    expect(q.explanation.length).toBeGreaterThan(10);
    if (Array.isArray(q.correct)) {
      expect(q.options?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(q.correct.length).toBeGreaterThan(0);
      for (const idx of q.correct) expect(idx).toBeLessThan(q.options!.length);
      expectUnique(q.options!);
      // Questões multi devem dizer quantas escolher, como na prova real
      if (q.correct.length > 1) expect(q.stem).toMatch(/Escolha \d/);
    }
    const row = toQuestionRow(q);
    const optionIds = row.options.map((o) => o.id);
    for (const c of row.correct) expect(optionIds).toContain(c);
  });

  it("multi informa a quantidade correta de alternativas", () => {
    for (const q of QUESTIONS) {
      if (!Array.isArray(q.correct) || q.correct.length < 2) continue;
      const n = Number(q.stem.match(/Escolha (\d)/)?.[1]);
      expect(n, q.id).toBe(q.correct.length);
    }
  });

  it("referências de plano apontam para trilhas e metas existentes", () => {
    for (const g of GOALS) expect(trackIds).toContain(g.track);
    for (const m of MILESTONES) {
      expect(trackIds).toContain(m.track);
      if ("goal" in m && m.goal) expect(goalIds).toContain(m.goal);
    }
    for (const t of TARGETS) expect(trackIds).toContain(t.track);
    for (const c of PLANNED_COSTS) expect(trackIds).toContain(c.track);
    for (const t of TASKS) expect(goalIds).toContain(t.goal);
    for (const p of PRESETS) expect(subjectIds).toContain(p.subject);
    for (const d of DECKS) if (d.subject) expect(subjectIds).toContain(d.subject);
  });

  it("tem questões suficientes por certificação", () => {
    const count = (prefix: string) => QUESTIONS.filter((q) => q.subject.startsWith(prefix)).length;
    expect(count("psm")).toBeGreaterThanOrEqual(45);
    expect(count("cobit")).toBeGreaterThanOrEqual(20);
    expect(count("itil")).toBeGreaterThanOrEqual(20);
  });
});

// Provas oficiais convertidas localmente (provas/ fica fora do git; no CI isto é pulado)

const provasDir = "provas/json";
const provaFiles = existsSync(provasDir) ? readdirSync(provasDir).filter((f) => f.endsWith(".json")) : [];

describe.skipIf(provaFiles.length === 0)("provas convertidas", () => {
  it.each(provaFiles)("%s é importável e usa assuntos existentes", (file) => {
    const r = parseImport(JSON.parse(readFileSync(`${provasDir}/${file}`, "utf8")));
    expect(r.ok, r.ok ? "" : r.error).toBe(true);
    if (!r.ok) return;
    for (const q of r.data.items) {
      expect(subjectIds, q.id).toContain(q.subject);
      expect(q.options?.length, q.id).toBe(5);
      expect(q.options?.every((o) => o.length > 0), q.id).toBe(true);
    }
    expect(r.data.items.length).toBeGreaterThanOrEqual(20);
  });
});

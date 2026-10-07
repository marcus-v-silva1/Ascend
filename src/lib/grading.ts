export type QuestionType = "single" | "multi" | "truefalse";

/** Corrige por igualdade de conjuntos: questões multi não têm acerto parcial (igual ao PSM). */
export function gradeAnswer(_type: QuestionType, correct: string[], selected: string[]): boolean {
  if (selected.length === 0 || selected.length !== correct.length) return false;
  const expected = new Set(correct);
  return selected.every((s) => expected.has(s));
}

export function scoreSession(correct: number, total: number, passPct: number) {
  if (total === 0) return { pct: 0, passed: false };
  const pct = Math.round((correct / total) * 10000) / 100;
  return { pct, passed: pct >= passPct };
}

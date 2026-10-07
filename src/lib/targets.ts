export type TargetScores = {
  compatibility: number | null;
  difficulty: number | null;
  salary_score: number | null;
  location_score: number | null;
};

export type Weights = Record<keyof TargetScores, number>;

// Compatibilidade pesa mais: aproveitar o que você já sabe encurta a preparação.
export const DEFAULT_WEIGHTS: Weights = {
  compatibility: 0.4,
  difficulty: 0.2,
  salary_score: 0.2,
  location_score: 0.2,
};

/** Nota 0–10. Dificuldade é invertida (10 = muito difícil vira 0). */
export function targetScore(t: TargetScores, weights: Weights = DEFAULT_WEIGHTS): number {
  let sum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights) as (keyof TargetScores)[]) {
    const raw = t[key];
    if (raw === null || raw === undefined) continue;
    const value = key === "difficulty" ? 10 - Number(raw) : Number(raw);
    sum += value * weights[key];
    totalWeight += weights[key];
  }
  if (totalWeight === 0) return 0;
  return Math.round((sum / totalWeight) * 10) / 10;
}

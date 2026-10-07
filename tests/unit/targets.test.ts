import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, targetScore } from "@/lib/targets";

describe("targetScore", () => {
  it("dificuldade alta reduz a nota (é invertida)", () => {
    const easy = targetScore({ compatibility: 9, difficulty: 3, salary_score: 8, location_score: 10 });
    const hard = targetScore({ compatibility: 9, difficulty: 9, salary_score: 8, location_score: 10 });
    expect(easy).toBeGreaterThan(hard);
  });

  it("resultado fica entre 0 e 10 com uma casa decimal", () => {
    const s = targetScore({ compatibility: 10, difficulty: 0, salary_score: 10, location_score: 10 });
    expect(s).toBe(10);
    const z = targetScore({ compatibility: 0, difficulty: 10, salary_score: 0, location_score: 0 });
    expect(z).toBe(0);
  });

  it("campos ausentes são ignorados e o peso é redistribuído", () => {
    const s = targetScore({ compatibility: 8, difficulty: null, salary_score: null, location_score: null });
    expect(s).toBe(8);
  });

  it("pesos padrão priorizam compatibilidade", () => {
    expect(DEFAULT_WEIGHTS.compatibility).toBeGreaterThan(DEFAULT_WEIGHTS.salary_score);
  });
});

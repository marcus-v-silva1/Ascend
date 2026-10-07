import { describe, expect, it } from "vitest";
import { gradeAnswer, scoreSession } from "@/lib/grading";

describe("gradeAnswer", () => {
  it("single: acerta só com a alternativa correta", () => {
    expect(gradeAnswer("single", ["b"], ["b"])).toBe(true);
    expect(gradeAnswer("single", ["b"], ["a"])).toBe(false);
  });

  it("multi: exige conjunto exato, ordem irrelevante", () => {
    expect(gradeAnswer("multi", ["a", "c"], ["c", "a"])).toBe(true);
    expect(gradeAnswer("multi", ["a", "c"], ["a"])).toBe(false);
    expect(gradeAnswer("multi", ["a", "c"], ["a", "b", "c"])).toBe(false);
  });

  it("truefalse", () => {
    expect(gradeAnswer("truefalse", ["true"], ["true"])).toBe(true);
    expect(gradeAnswer("truefalse", ["true"], ["false"])).toBe(false);
  });

  it("resposta vazia é erro", () => {
    expect(gradeAnswer("single", ["a"], [])).toBe(false);
  });
});

describe("scoreSession", () => {
  it("calcula percentual e aprovação pela nota de corte", () => {
    expect(scoreSession(68, 80, 85)).toEqual({ pct: 85, passed: true });
    expect(scoreSession(67, 80, 85)).toEqual({ pct: 83.75, passed: false });
  });

  it("sessão vazia vale zero", () => {
    expect(scoreSession(0, 0, 65)).toEqual({ pct: 0, passed: false });
  });
});

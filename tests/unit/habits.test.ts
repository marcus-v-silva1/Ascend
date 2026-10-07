import { describe, expect, it } from "vitest";
import { countThisWeek, currentStreak, lastNDays, longestStreak } from "@/lib/habits";

const set = (...d: string[]) => new Set(d);

describe("currentStreak", () => {
  it("conta até hoje", () => {
    expect(currentStreak(set("2026-10-05", "2026-10-06", "2026-10-07"), "2026-10-07")).toBe(3);
  });

  it("hoje ainda não feito não quebra a sequência de ontem", () => {
    expect(currentStreak(set("2026-10-05", "2026-10-06"), "2026-10-07")).toBe(2);
  });

  it("um dia sem fazer zera", () => {
    expect(currentStreak(set("2026-10-04", "2026-10-05"), "2026-10-07")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("acha a maior sequência", () => {
    expect(longestStreak(set("2026-09-01", "2026-09-02", "2026-09-03", "2026-09-10", "2026-09-11"))).toBe(3);
    expect(longestStreak(set())).toBe(0);
  });
});

describe("countThisWeek", () => {
  it("conta de segunda a domingo", () => {
    // semana de 05/10 (seg) a 11/10 (dom)
    expect(countThisWeek(set("2026-10-04", "2026-10-05", "2026-10-07"), "2026-10-08")).toBe(2);
  });
});

describe("lastNDays", () => {
  it("termina hoje", () => {
    expect(lastNDays("2026-10-07", 3)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
  });
});

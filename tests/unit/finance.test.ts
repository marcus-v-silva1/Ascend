import { describe, expect, it } from "vitest";
import { averageMonthly, monthsToGoal, payoffPlan, toBRL } from "@/lib/finance";

const rates = { usd_brl: 5.4, eur_brl: 6.2 };

describe("toBRL", () => {
  it("converte moedas", () => {
    expect(toBRL(200, "USD", rates)).toBeCloseTo(1080);
    expect(toBRL(100, "eur", rates)).toBeCloseTo(620);
    expect(toBRL(50, "BRL", rates)).toBe(50);
  });
});

describe("monthsToGoal", () => {
  it("arredonda para cima", () => expect(monthsToGoal(10000, 60000, 3000)).toBe(17));
  it("meta batida", () => expect(monthsToGoal(60000, 60000, 0)).toBe(0));
  it("sem aporte não chega", () => expect(monthsToGoal(0, 100, 0)).toBeNull());
});

describe("averageMonthly", () => {
  it("média dos aportes recentes", () => {
    const entries = [
      { amount: 3000, date: "2026-08-10" },
      { amount: 3000, date: "2026-09-10" },
      { amount: 3000, date: "2026-10-05" },
      { amount: 99999, date: "2025-01-01" },
    ];
    const avg = averageMonthly(entries, "2026-10-07");
    expect(avg).toBeGreaterThan(2500);
    expect(avg).toBeLessThan(4600);
  });

  it("sem histórico é zero", () => expect(averageMonthly([], "2026-10-07")).toBe(0));
});

describe("payoffPlan", () => {
  it("sem juros", () => expect(payoffPlan(1000, 0, 250)).toEqual({ months: 4, interest: 0 }));
  it("pagamento menor que juros nunca quita", () => expect(payoffPlan(10000, 5, 400)).toBeNull());
  it("com juros leva mais meses", () => {
    const plan = payoffPlan(10000, 2, 1000)!;
    expect(plan.months).toBeGreaterThan(10);
    expect(plan.interest).toBeGreaterThan(0);
  });
});

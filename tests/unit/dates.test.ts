import { describe, expect, it } from "vitest";
import { addDays, daysUntil, localDate, weekStart } from "@/lib/dates";

describe("dates", () => {
  it("localDate usa UTC-3", () => {
    // 02:00 UTC do dia 8 ainda é dia 7 em Belém
    expect(localDate(new Date("2026-10-08T02:00:00Z"))).toBe("2026-10-07");
  });

  it("weekStart volta para segunda-feira", () => {
    expect(weekStart("2026-10-07")).toBe("2026-10-05"); // quarta → segunda
    expect(weekStart("2026-10-11")).toBe("2026-10-05"); // domingo → segunda
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
  });

  it("addDays atravessa meses", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("daysUntil", () => {
    expect(daysUntil("2027-01-17", "2027-01-10")).toBe(7);
  });
});

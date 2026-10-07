import { describe, expect, it } from "vitest";
import { newCardRow, scheduleReview, Rating } from "@/lib/srs";

const now = new Date("2026-10-07T12:00:00Z");

describe("srs (FSRS)", () => {
  it("cria card novo vencendo agora", () => {
    const row = newCardRow(now);
    expect(row.state).toBe(0);
    expect(row.reps).toBe(0);
    expect(new Date(row.due).getTime()).toBe(now.getTime());
  });

  it("Good em card novo agenda para o futuro e incrementa reps", () => {
    const { card, log } = scheduleReview(newCardRow(now), Rating.Good, now);
    expect(card.reps).toBe(1);
    expect(new Date(card.due).getTime()).toBeGreaterThan(now.getTime());
    expect(log.rating).toBe(Rating.Good);
  });

  it("Easy agenda mais longe que Hard", () => {
    const hard = scheduleReview(newCardRow(now), Rating.Hard, now).card;
    const easy = scheduleReview(newCardRow(now), Rating.Easy, now).card;
    expect(new Date(easy.due).getTime()).toBeGreaterThan(new Date(hard.due).getTime());
  });

  it("Again em card em revisão conta lapso", () => {
    let row = newCardRow(now);
    let t = now;
    for (let i = 0; i < 4; i++) {
      row = scheduleReview(row, Rating.Good, t).card;
      t = new Date(row.due);
    }
    expect(row.state).toBe(2);
    const lapsed = scheduleReview(row, Rating.Again, t).card;
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe(3);
  });

  it("serializa datas como ISO para o banco", () => {
    const { card } = scheduleReview(newCardRow(now), Rating.Good, now);
    expect(typeof card.due).toBe("string");
    expect(typeof card.last_review).toBe("string");
  });
});

import { addDays, weekStart } from "./dates";

/** Dias seguidos com o hábito feito, terminando hoje (ou ontem, se hoje ainda não foi feito). */
export function currentStreak(done: Set<string>, today: string): number {
  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function longestStreak(done: Set<string>): number {
  const days = [...done].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Quantas vezes foi feito na semana (segunda a domingo) da data. */
export function countThisWeek(done: Set<string>, today: string): number {
  const start = weekStart(today);
  let n = 0;
  for (let i = 0; i < 7; i++) if (done.has(addDays(start, i))) n++;
  return n;
}

export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

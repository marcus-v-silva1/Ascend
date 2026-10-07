export type QuestionFilter = "all" | "unseen" | "wrong" | "weak";

export type QuestionProgress = {
  id: string;
  subject_id: string | null;
  attempts: number;
  last_correct: boolean | null;
  correct_days: number;
};

/** Uma questão está dominada após acertos em 3 dias distintos e a última tentativa correta. */
export const MASTERY_DAYS = 3;

export function isMastered(p: Pick<QuestionProgress, "correct_days" | "last_correct">) {
  return p.correct_days >= MASTERY_DAYS && p.last_correct === true;
}

export function filterQuestions(questions: QuestionProgress[], filter: QuestionFilter) {
  switch (filter) {
    case "unseen":
      return questions.filter((q) => q.attempts === 0);
    case "wrong":
      return questions.filter((q) => q.last_correct === false);
    case "weak":
      return questions.filter((q) => !isMastered(q));
    default:
      return questions;
  }
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Seleciona questões intercalando assuntos (prática intercalada):
 * embaralha dentro de cada assunto e distribui em rodízio entre eles.
 */
export function pickInterleaved(
  questions: QuestionProgress[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const bySubject = new Map<string, QuestionProgress[]>();
  for (const q of questions) {
    const key = q.subject_id ?? "_";
    bySubject.set(key, [...(bySubject.get(key) ?? []), q]);
  }
  const queues = shuffle([...bySubject.values()].map((qs) => shuffle(qs, random)), random);
  const picked: string[] = [];
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) picked.push(next.id);
      if (picked.length >= count) break;
    }
  }
  return picked;
}

/** Retorna o id do assunto e de todos os descendentes. */
export function descendantIds(subjects: { id: string; parent_id: string | null }[], rootId: string): string[] {
  const children = new Map<string, string[]>();
  for (const s of subjects) {
    if (!s.parent_id) continue;
    children.set(s.parent_id, [...(children.get(s.parent_id) ?? []), s.id]);
  }
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/** Pronto para a prova quando os últimos N simulados completos atingem a nota de prontidão. */
export function isExamReady(lastScores: number[], readyPct: number, needed = 3) {
  return lastScores.length >= needed && lastScores.slice(0, needed).every((s) => s >= readyPct);
}

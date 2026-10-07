export type SeedSubject = {
  id: string;
  name: string;
  kind: "exam" | "discipline" | "topic";
  parent?: string;
  description?: string;
};

/**
 * Formato compacto para escrever questões:
 * - options: textos das alternativas (viram ids a, b, c…)
 * - correct: índices das corretas (0 = a) ou boolean para verdadeiro/falso
 */
export type SeedQuestion = {
  id: string;
  subject: string;
  stem: string;
  options?: string[];
  correct: number[] | boolean;
  explanation: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  source?: string;
  source_url?: string;
  board?: string;
  year?: number;
};

export type SeedCard = { id: string; front: string; back: string; tags?: string[] };

export type SeedDeck = {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  source?: "manual" | "vocab" | "phrase";
  cards: SeedCard[];
};

export type SeedPreset = {
  id: string;
  name: string;
  subject: string;
  question_count: number;
  duration_min: number;
  pass_pct: number;
  ready_pct?: number;
  official_url?: string;
};

const LETTERS = "abcdefghij";

export function toQuestionRow(q: SeedQuestion) {
  if (typeof q.correct === "boolean") {
    return {
      external_id: q.id,
      type: "truefalse" as const,
      stem: q.stem,
      options: [
        { id: "true", text: "Certo" },
        { id: "false", text: "Errado" },
      ],
      correct: [q.correct ? "true" : "false"],
      explanation: q.explanation,
      difficulty: q.difficulty ?? null,
      source: q.source ?? null,
      source_url: q.source_url ?? null,
      board: q.board ?? null,
      year: q.year ?? null,
    };
  }
  const options = (q.options ?? []).map((text, i) => ({ id: LETTERS[i], text }));
  return {
    external_id: q.id,
    type: q.correct.length > 1 ? ("multi" as const) : ("single" as const),
    stem: q.stem,
    options,
    correct: q.correct.map((i) => LETTERS[i]),
    explanation: q.explanation,
    difficulty: q.difficulty ?? null,
    source: q.source ?? null,
    source_url: q.source_url ?? null,
    board: q.board ?? null,
    year: q.year ?? null,
  };
}

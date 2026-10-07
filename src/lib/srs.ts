import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";

export { Rating };
export type { Grade };

/** Colunas FSRS de public.flashcards, com datas em ISO. */
export type CardRow = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

export type ReviewLogRow = {
  rating: number;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  review: string;
};

// Retenção desejada de 90%: padrão do FSRS, bom equilíbrio entre carga e memória.
const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }));

function toRow(card: Card): CardRow {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

function fromRow(row: CardRow): Card {
  return {
    ...row,
    due: new Date(row.due),
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

export function newCardRow(now: Date = new Date()): CardRow {
  return toRow(createEmptyCard(now));
}

export function scheduleReview(row: CardRow, rating: Grade, now: Date = new Date()) {
  const { card, log } = scheduler.next(fromRow(row), now, rating);
  const logRow: ReviewLogRow = {
    rating: log.rating,
    state: log.state,
    due: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    last_elapsed_days: log.last_elapsed_days,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    review: log.review.toISOString(),
  };
  return { card: toRow(card), log: logRow };
}

/** Prévia do intervalo de cada nota, para mostrar nos botões. */
export function previewIntervals(row: CardRow, now: Date = new Date()) {
  const preview = scheduler.repeat(fromRow(row), now);
  const out = {} as Record<Grade, Date>;
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]) {
    out[g] = preview[g].card.due;
  }
  return out;
}

export function pickCardFields<T extends CardRow>(row: T): CardRow {
  const { due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review } = row;
  return { due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review };
}

import { describe, expect, it } from "vitest";
import {
  descendantIds,
  filterQuestions,
  isExamReady,
  isMastered,
  pickInterleaved,
  type QuestionProgress,
} from "@/lib/study";

const qp = (id: string, subject: string, extra: Partial<QuestionProgress> = {}): QuestionProgress => ({
  id,
  subject_id: subject,
  attempts: 0,
  last_correct: null,
  correct_days: 0,
  ...extra,
});

// Gerador determinístico para os testes
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("isMastered", () => {
  it("exige 3 dias de acerto e última tentativa correta", () => {
    expect(isMastered({ correct_days: 3, last_correct: true })).toBe(true);
    expect(isMastered({ correct_days: 3, last_correct: false })).toBe(false);
    expect(isMastered({ correct_days: 2, last_correct: true })).toBe(false);
  });
});

describe("filterQuestions", () => {
  const qs = [
    qp("new", "a"),
    qp("wrong", "a", { attempts: 2, last_correct: false, correct_days: 1 }),
    qp("mastered", "a", { attempts: 5, last_correct: true, correct_days: 3 }),
    qp("learning", "a", { attempts: 1, last_correct: true, correct_days: 1 }),
  ];

  it("unseen", () => expect(filterQuestions(qs, "unseen").map((q) => q.id)).toEqual(["new"]));
  it("wrong", () => expect(filterQuestions(qs, "wrong").map((q) => q.id)).toEqual(["wrong"]));
  it("weak exclui dominadas", () =>
    expect(filterQuestions(qs, "weak").map((q) => q.id)).toEqual(["new", "wrong", "learning"]));
  it("all", () => expect(filterQuestions(qs, "all")).toHaveLength(4));
});

describe("pickInterleaved", () => {
  const qs = [
    ...Array.from({ length: 6 }, (_, i) => qp(`a${i}`, "A")),
    ...Array.from({ length: 6 }, (_, i) => qp(`b${i}`, "B")),
  ];

  it("respeita a quantidade pedida sem repetir", () => {
    const ids = pickInterleaved(qs, 8, seeded());
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(8);
  });

  it("alterna entre assuntos", () => {
    const ids = pickInterleaved(qs, 6, seeded());
    const subjects = ids.map((id) => id[0]);
    for (let i = 1; i < subjects.length; i++) expect(subjects[i]).not.toBe(subjects[i - 1]);
  });

  it("devolve tudo quando pede mais do que existe", () => {
    expect(pickInterleaved(qs, 50, seeded())).toHaveLength(12);
  });
});

describe("descendantIds", () => {
  it("inclui raiz e netos", () => {
    const subjects = [
      { id: "root", parent_id: null },
      { id: "c1", parent_id: "root" },
      { id: "g1", parent_id: "c1" },
      { id: "other", parent_id: null },
    ];
    expect(descendantIds(subjects, "root").sort()).toEqual(["c1", "g1", "root"]);
  });
});

describe("isExamReady", () => {
  it("precisa dos últimos 3 simulados acima da nota", () => {
    expect(isExamReady([96, 97, 95], 95)).toBe(true);
    expect(isExamReady([96, 90, 99], 95)).toBe(false);
    expect(isExamReady([99, 99], 95)).toBe(false);
  });
});

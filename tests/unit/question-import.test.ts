import { describe, expect, it } from "vitest";
import { parseImport, provaTag, questionNumber, stemKey } from "@/lib/question-import";

const q = (extra: object = {}) => ({
  subject: "conc-redes",
  stem: "O protocolo DNS usa a porta 53.",
  correct: true,
  explanation: "Porta 53.",
  ...extra,
});

describe("parseImport", () => {
  it("aceita lista simples", () => {
    const r = parseImport([q()]);
    expect(r.ok && r.data.items).toHaveLength(1);
    expect(r.ok && r.data.prova).toBeUndefined();
  });

  it("aceita prova com questões e marca a etiqueta da prova", () => {
    const r = parseImport({
      prova: { slug: "dataprev-2024-dev", name: "Dataprev 2024", durationMin: 240 },
      questions: [q({ id: "dataprev-2024-dev-q01" })],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prova?.passPct).toBe(60);
    expect(r.data.items[0].tags).toEqual([provaTag("dataprev-2024-dev")]);
  });

  it("converte letras do gabarito em índices", () => {
    const r = parseImport([q({ options: ["a", "b", "c"], correct: ["C"] })]);
    expect(r.ok && r.data.items[0].correct).toEqual([2]);
  });

  it("recusa gabarito fora das alternativas", () => {
    const r = parseImport([q({ options: ["a", "b"], correct: [3] })]);
    expect(r.ok).toBe(false);
  });

  it("recusa múltipla escolha sem alternativas", () => {
    const r = parseImport([q({ correct: [0] })]);
    expect(r).toEqual({ ok: false, error: expect.stringContaining("sem alternativas") });
  });

  it("recusa slug inválido", () => {
    const r = parseImport({ prova: { slug: "Prova 1", name: "x", durationMin: 10 }, questions: [q()] });
    expect(r.ok).toBe(false);
  });
});

describe("helpers", () => {
  it("stemKey ignora espaços e caixa", () => {
    expect(stemKey("  Qual  é\no timebox? ")).toBe(stemKey("qual é o timebox?"));
  });

  it("questionNumber lê o número do id externo", () => {
    expect(questionNumber("dataprev-2024-ati-dev-q07")).toBe(7);
    expect(questionNumber("psm-001")).toBe(Number.MAX_SAFE_INTEGER);
    expect(questionNumber(null)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

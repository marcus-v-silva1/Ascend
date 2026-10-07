import { describe, expect, it } from "vitest";
import { parseCardsCsv, toCardsCsv } from "@/lib/csv";

describe("parseCardsCsv", () => {
  it("lê ponto e vírgula", () => {
    expect(parseCardsCsv("apple;maçã\nbook;livro")).toEqual([
      { front: "apple", back: "maçã" },
      { front: "book", back: "livro" },
    ]);
  });

  it("lê tab e ignora cabeçalho do Anki", () => {
    expect(parseCardsCsv("#separator:tab\n#html:false\nrun\tcorrer\n")).toEqual([{ front: "run", back: "correr" }]);
  });

  it("aceita aspas com separador e quebra de linha", () => {
    expect(parseCardsCsv('"a; b";"linha 1\nlinha 2"')).toEqual([{ front: "a; b", back: "linha 1\nlinha 2" }]);
  });

  it("ignora linhas incompletas e CRLF", () => {
    expect(parseCardsCsv("só frente\r\nx;y\r\n")).toEqual([{ front: "x", back: "y" }]);
  });
});

describe("toCardsCsv", () => {
  it("faz ida e volta", () => {
    const cards = [
      { front: 'diz "oi"', back: "a;b" },
      { front: "multi", back: "l1\nl2" },
    ];
    expect(parseCardsCsv(toCardsCsv(cards))).toEqual(cards);
  });
});

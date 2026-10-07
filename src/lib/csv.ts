export type CardPair = { front: string; back: string };

/**
 * Lê cartões no formato do Anki (texto separado por ; ou tab, uma linha por cartão).
 * Aceita campos entre aspas com separador ou quebra de linha dentro.
 * Linhas iniciadas com # (cabeçalhos do Anki) são ignoradas.
 */
export function parseCardsCsv(input: string): CardPair[] {
  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const body = text
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .join("\n");
  const sep = body.includes("\t") ? "\t" : body.includes(";") ? ";" : ",";

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"' && field === "") quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows
    .filter((r) => r.length >= 2 && !r[0].startsWith("#"))
    .map((r) => ({ front: r[0].trim(), back: r[1].trim() }))
    .filter((c) => c.front && c.back);
}

function escape(value: string, sep: string) {
  return /["\n]/.test(value) || value.includes(sep) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Exporta no formato que o Anki importa (separador ;). */
export function toCardsCsv(cards: CardPair[], sep = ";"): string {
  const header = `#separator:${sep === "\t" ? "tab" : "semicolon"}\n#html:false\n`;
  return header + cards.map((c) => `${escape(c.front, sep)}${sep}${escape(c.back, sep)}`).join("\n") + "\n";
}

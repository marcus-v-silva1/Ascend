import { z } from "zod";

const item = z.object({
  id: z.string().min(1).max(120).optional(),
  subject: z.string().min(1),
  stem: z.string().min(5),
  options: z.array(z.string().min(1)).min(2).max(10).optional(),
  correct: z.union([z.boolean(), z.array(z.number().int().min(0)).min(1), z.array(z.string().regex(/^[a-j]$/i)).min(1)]),
  explanation: z.string().default(""),
  source: z.string().optional(),
  source_url: z.url().optional(),
  board: z.string().optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().min(1).max(80)).max(20).optional(),
});

const prova = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug só com letras minúsculas, números e hífen"),
  name: z.string().min(3).max(200),
  subject: z.string().min(1).default("concursos"),
  durationMin: z.number().int().min(1).max(600),
  passPct: z.number().int().min(1).max(100).default(60),
  officialUrl: z.url().optional(),
});

const file = z.union([z.array(item).max(2000), z.object({ prova: prova.optional(), questions: z.array(item).min(1).max(2000) })]);

export type ImportItem = Omit<z.infer<typeof item>, "correct"> & { correct: boolean | number[] };
export type ImportProva = z.infer<typeof prova>;
export type ParsedImport = { prova?: ImportProva; items: ImportItem[] };

/** Valida o JSON de importação e normaliza o gabarito para índices (0 = A). */
export function parseImport(json: unknown): { ok: true; data: ParsedImport } | { ok: false; error: string } {
  const parsed = file.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.join(".");
    return { ok: false, error: `${path ? `${path}: ` : ""}${issue.message}` };
  }
  const raw = Array.isArray(parsed.data) ? { items: parsed.data } : { prova: parsed.data.prova, items: parsed.data.questions };

  const items: ImportItem[] = [];
  for (const [i, q] of raw.items.entries()) {
    const correct =
      typeof q.correct === "boolean"
        ? q.correct
        : q.correct.map((c) => (typeof c === "number" ? c : c.toLowerCase().charCodeAt(0) - 97));
    if (typeof correct !== "boolean") {
      const n = q.options?.length ?? 0;
      if (n === 0) return { ok: false, error: `Item ${i}: questão de múltipla escolha sem alternativas.` };
      if (correct.some((c) => c >= n)) return { ok: false, error: `Item ${i}: gabarito aponta para alternativa inexistente.` };
    }
    const tags = [...(q.tags ?? [])];
    if (raw.prova && !tags.includes(provaTag(raw.prova.slug))) tags.push(provaTag(raw.prova.slug));
    items.push({ ...q, correct, tags });
  }
  return { ok: true, data: { prova: raw.prova, items } };
}

export function provaTag(slug: string) {
  return `prova:${slug}`;
}

/** Normaliza enunciados para detectar a mesma questão em provas diferentes. */
export function stemKey(stem: string) {
  return stem.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Ordem original da prova a partir do id externo (ex.: "dataprev-2024-ati-dev-q07" → 7). */
export function questionNumber(externalId: string | null | undefined): number {
  const m = externalId?.match(/-q(\d+)$/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

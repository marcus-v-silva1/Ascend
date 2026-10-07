import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getQuestionProgress, getSubjects } from "@/lib/data/study";
import { descendantIds, isMastered } from "@/lib/study";
import { cn } from "@/lib/utils";
import { deleteQuestion } from "./actions";
import { CreateQuestionForm, ImportForm } from "./forms";

export const metadata: Metadata = { title: "Banco de questões" };

const PAGE = 50;

export default async function QuestionBankPage({ searchParams }: PageProps<"/estudos/questoes">) {
  const sp = await searchParams;
  const subjectFilter = typeof sp.assunto === "string" ? sp.assunto : undefined;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const { supabase } = await requireUser();

  const subjects = await getSubjects(supabase);
  const exams = subjects.filter((s) => s.kind === "exam");
  const scope = subjectFilter ? descendantIds(subjects, subjectFilter) : undefined;

  let query = supabase
    .from("questions")
    .select("id, stem, type, source, board, year, subject_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (scope) query = query.in("subject_id", scope);
  const [{ data: questions, count }, progress] = await Promise.all([query, getQuestionProgress(supabase, scope)]);

  const progressById = new Map(progress.map((p) => [p.id, p]));
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const pages = Math.ceil((count ?? 0) / PAGE);

  // Opções do formulário: "Exame › Tópico"
  const options = subjects
    .filter((s) => s.kind !== "exam")
    .map((s) => ({ id: s.id, label: `${subjectName.get(s.parent_id ?? "") ?? ""} › ${s.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const href = (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v));
    const s = q.toString();
    return `/estudos/questoes${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Banco de questões" description={`${count ?? 0} questões${subjectFilter ? ` em ${subjectName.get(subjectFilter)}` : ""}.`} />

      <nav aria-label="Filtrar por exame" className="mb-4 flex flex-wrap gap-2">
        <Link href={href({})} className={cn("rounded-full border px-3 py-1 text-sm", !subjectFilter ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground")}>
          Todas
        </Link>
        {exams.map((e) => (
          <Link key={e.id} href={href({ assunto: e.id })} className={cn("rounded-full border px-3 py-1 text-sm", subjectFilter === e.id ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground")}>
            {e.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Questões">
          <ul className="divide-y rounded-lg border bg-card">
            {(questions ?? []).map((q: { id: string; stem: string; type: string; source: string | null; board: string | null; year: number | null; subject_id: string | null }) => {
              const p = progressById.get(q.id);
              const status = !p || p.attempts === 0 ? "nova" : isMastered(p) ? "dominada" : p.last_correct ? "acertou" : "errou";
              return (
                <li key={q.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{q.stem}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {subjectName.get(q.subject_id ?? "")}
                      {q.board && ` · ${q.board}`}
                      {q.year && ` ${q.year}`}
                      {p && p.attempts > 0 && ` · ${p.attempts} tentativa${p.attempts > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-xs",
                      status === "dominada" && "bg-success/10 text-success",
                      status === "errou" && "bg-destructive/10 text-destructive",
                      status === "acertou" && "bg-accent text-accent-foreground",
                      status === "nova" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {status}
                  </span>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="text-xs text-muted-foreground hover:text-destructive" aria-label="Excluir questão">
                      excluir
                    </button>
                  </form>
                </li>
              );
            })}
            {(questions ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma questão aqui ainda. Adicione ou importe ao lado.</li>}
          </ul>
          {pages > 1 && (
            <nav aria-label="Paginação" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link href={href({ assunto: subjectFilter, pagina: page - 1 })} className="underline-offset-4 hover:underline">Anterior</Link> : <span />}
              <span className="num text-muted-foreground">Página {page} de {pages}</span>
              {page < pages ? <Link href={href({ assunto: subjectFilter, pagina: page + 1 })} className="underline-offset-4 hover:underline">Próxima</Link> : <span />}
            </nav>
          )}
        </section>

        <div className="space-y-8">
          <section aria-labelledby="add-q" className="rounded-lg border bg-card p-5">
            <h2 id="add-q" className="mb-4 text-lg font-semibold">Adicionar questão</h2>
            <CreateQuestionForm subjects={options} />
          </section>
          <section aria-labelledby="import-q" className="rounded-lg border bg-card p-5">
            <h2 id="import-q" className="mb-2 text-lg font-semibold">Importar em lote</h2>
            <ImportForm />
          </section>
        </div>
      </div>
    </>
  );
}

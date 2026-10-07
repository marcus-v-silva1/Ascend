import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/link-button";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { WhyWrongForm } from "./why-wrong-form";

export const metadata: Metadata = { title: "Resultado" };

type Option = { id: string; text: string };

export default async function ResultPage({ params }: PageProps<"/estudos/sessao/[id]/resultado">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id, mode, total, correct_count, score_pct, pass_pct, started_at, finished_at, exam_presets(name)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, is_correct, selected, why_wrong, time_ms, questions(id, stem, options, correct, explanation, subjects(name))")
    .eq("session_id", id)
    .order("created_at");

  type Row = {
    id: string;
    is_correct: boolean;
    selected: string[];
    why_wrong: string | null;
    time_ms: number | null;
    questions: { id: string; stem: string; options: Option[]; correct: string[]; explanation: string | null; subjects: { name: string } | null };
  };
  const rows = (attempts ?? []) as unknown as Row[];

  const bySubject = new Map<string, { total: number; correct: number }>();
  for (const r of rows) {
    const name = r.questions.subjects?.name ?? "Sem assunto";
    const cur = bySubject.get(name) ?? { total: 0, correct: 0 };
    cur.total++;
    if (r.is_correct) cur.correct++;
    bySubject.set(name, cur);
  }

  const wrong = rows.filter((r) => !r.is_correct);
  const score = Number(session.score_pct ?? 0);
  const passed = session.pass_pct ? score >= session.pass_pct : null;
  const minutes = session.finished_at
    ? Math.round((new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;
  const avgSeconds = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.time_ms ?? 0), 0) / rows.length / 1000)
    : null;
  const presetName = (session.exam_presets as unknown as { name: string } | null)?.name;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-muted-foreground">{presetName ?? (session.mode === "mock" ? "Simulado" : "Prática")}</p>
      <div className="mt-1 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className={cn("num text-6xl font-semibold tracking-tight", passed === true && "text-success", passed === false && "text-destructive")} style={{ fontFamily: "var(--font-sora)" }}>
          {Math.round(score)}%
        </p>
        <div className="pb-2 text-sm text-muted-foreground">
          <p className="num">{session.correct_count} de {session.total} certas{minutes !== null && ` · ${minutes} min`}{avgSeconds !== null && ` · ${avgSeconds}s por questão`}</p>
          {passed !== null && (
            <p className={passed ? "text-success" : "text-destructive"}>
              {passed ? `Aprovado (corte ${session.pass_pct}%)` : `Abaixo do corte de ${session.pass_pct}%`}
            </p>
          )}
        </div>
      </div>

      <section className="mt-8" aria-labelledby="by-subject">
        <h2 id="by-subject" className="mb-3 text-lg font-semibold">Por assunto</h2>
        <ul className="divide-y rounded-lg border bg-card">
          {[...bySubject.entries()]
            .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
            .map(([name, s]) => (
              <li key={name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <span>{name}</span>
                <span className="num text-muted-foreground">{s.correct}/{s.total} · {Math.round((s.correct / s.total) * 100)}%</span>
              </li>
            ))}
        </ul>
      </section>

      {wrong.length > 0 && (
        <section className="mt-8" aria-labelledby="wrong">
          <h2 id="wrong" className="text-lg font-semibold">Revise o que errou</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Cada erro já virou um flashcard no deck “Meus erros”. Escrever por que errou é o que mais ajuda a não repetir.
          </p>
          <ol className="space-y-4">
            {wrong.map((r, i) => {
              const correct = new Set(r.questions.correct);
              const chosen = new Set(r.selected);
              return (
                <li key={r.id} className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{i + 1}. {r.questions.subjects?.name}</p>
                  <p className="mt-1 font-medium whitespace-pre-line">{r.questions.stem}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {r.questions.options.map((o) => (
                      <li
                        key={o.id}
                        className={cn(
                          "rounded px-2 py-1",
                          correct.has(o.id) && "bg-success/10 text-success",
                          !correct.has(o.id) && chosen.has(o.id) && "bg-destructive/10 text-destructive line-through",
                          !correct.has(o.id) && !chosen.has(o.id) && "text-muted-foreground",
                        )}
                      >
                        {o.text}
                      </li>
                    ))}
                    {r.selected.length === 0 && <li className="px-2 text-destructive">Não respondida</li>}
                  </ul>
                  {r.questions.explanation && <p className="mt-3 text-sm leading-relaxed">{r.questions.explanation}</p>}
                  <WhyWrongForm attemptId={r.id} initial={r.why_wrong} />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <LinkButton href="/estudos">Nova sessão</LinkButton>
        <LinkButton href="/flashcards/revisar" variant="outline">Revisar flashcards</LinkButton>
      </div>
    </div>
  );
}

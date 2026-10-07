import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/link-button";
import { requireUser } from "@/lib/auth";
import { getExamsOverview } from "@/lib/data/study";
import { isExamReady } from "@/lib/study";
import { StartForm } from "./start-form";

export const metadata: Metadata = { title: "Questões" };

function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function StudyPage() {
  const { supabase } = await requireUser();
  const exams = await getExamsOverview(supabase);

  return (
    <>
      <PageHeader
        title="Questões"
        description="Responder questões fixa mais do que reler. Uma questão conta como dominada quando você acerta em 3 dias diferentes."
        actions={
          <LinkButton variant="outline" href="/estudos/questoes">
            Banco de questões
          </LinkButton>
        }
      />

      <div className="space-y-6">
        {exams.filter((e) => e.total > 0 || e.presets.length > 0).map((exam) => {
          const mainPreset = exam.presets[0];
          const ready = mainPreset ? isExamReady(mainPreset.lastScores, mainPreset.ready_pct) : false;
          return (
            <section key={exam.subject.id} className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby={`exam-${exam.subject.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 id={`exam-${exam.subject.id}`} className="text-xl font-semibold">{exam.subject.name}</h2>
                  {exam.subject.description && <p className="mt-0.5 text-sm text-muted-foreground">{exam.subject.description}</p>}
                </div>
                <dl className="flex gap-6 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Dominadas</dt>
                    <dd className="num text-lg font-semibold">{exam.mastered}<span className="text-sm font-normal text-muted-foreground">/{exam.total}</span></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Acerto</dt>
                    <dd className="num text-lg font-semibold">{exam.accuracy === null ? "—" : `${exam.accuracy}%`}</dd>
                  </div>
                  {mainPreset && (
                    <div>
                      <dt className="text-muted-foreground">Últimos simulados</dt>
                      <dd className="num text-lg font-semibold">
                        {mainPreset.lastScores.length ? mainPreset.lastScores.slice(0, 3).map((s) => `${Math.round(s)}%`).join(" · ") : "—"}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {mainPreset && (
                <p className={ready ? "mt-3 rounded-md bg-success/10 px-3 py-2 text-sm text-success" : "mt-3 text-sm text-muted-foreground"}>
                  {ready
                    ? `Pronto para a prova: 3 simulados seguidos com ${mainPreset.ready_pct}% ou mais.`
                    : `Critério para marcar a prova: 3 simulados seguidos com ${mainPreset.ready_pct}% ou mais.`}
                  {mainPreset.official_url && (
                    <a href={mainPreset.official_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 underline-offset-4 hover:underline">
                      Página oficial <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                </p>
              )}

              <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <ul className="space-y-3">
                  {exam.topics.map((t) => (
                    <li key={t.subject.id}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span>{t.subject.name}</span>
                        <span className="num shrink-0 text-xs text-muted-foreground">
                          {t.mastered}/{t.total}
                          {t.accuracy !== null && ` · ${t.accuracy}%`}
                        </span>
                      </div>
                      <Meter value={t.mastered} max={t.total} className="mt-1" />
                    </li>
                  ))}
                </ul>
                <StartForm
                  examId={exam.subject.id}
                  topics={exam.topics.filter((t) => t.total > 0).map((t) => ({ id: t.subject.id, name: t.subject.name, total: t.total }))}
                  presets={exam.presets}
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

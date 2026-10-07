import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { addDays, formatDate, localDate, startOfLocalDay, weekStart } from "@/lib/dates";
import { saveWeeklyReview } from "../actions";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Revisão semanal" };

type Review = { week_start: string; wins: string | null; lessons: string | null; blockers: string | null; next_focus: string | null; energy: number | null };

const QUESTIONS: { name: keyof Review; label: string; hint: string }[] = [
  { name: "wins", label: "O que deu certo?", hint: "Vitórias, mesmo pequenas. Ex.: 3 simulados, 5 candidaturas." },
  { name: "lessons", label: "O que aprendi sobre como eu estudo?", hint: "Horário que funcionou, distração que atrapalhou, técnica que ajudou." },
  { name: "blockers", label: "O que travou?", hint: "Seja específico. Um bloqueio nomeado é meio resolvido." },
  { name: "next_focus", label: "Quais são as 3 prioridades da próxima semana?", hint: "Depois, leve-as para a coluna “Esta semana” em Tarefas." },
];

export default async function WeeklyReviewPage() {
  const { supabase } = await requireUser();
  const today = localDate();
  const monday = weekStart(today);
  const weekStartTs = startOfLocalDay(monday);

  const [{ data: reviews }, { count: answered }, { count: correct }, { data: pomos }, { count: reviewsDone }, { count: tasksDone }, { data: habitLogs }] =
    await Promise.all([
      supabase.from("weekly_reviews").select("week_start, wins, lessons, blockers, next_focus, energy").order("week_start", { ascending: false }).limit(12),
      supabase.from("attempts").select("id", { count: "exact", head: true }).gte("created_at", weekStartTs),
      supabase.from("attempts").select("id", { count: "exact", head: true }).gte("created_at", weekStartTs).eq("is_correct", true),
      supabase.from("pomodoro_sessions").select("duration_min").gte("started_at", weekStartTs),
      supabase.from("review_logs").select("id", { count: "exact", head: true }).gte("review", weekStartTs),
      supabase.from("tasks").select("id", { count: "exact", head: true }).gte("completed_at", weekStartTs),
      supabase.from("habit_logs").select("id").gte("date", monday),
    ]);

  const list = (reviews ?? []) as Review[];
  const current = list.find((r) => r.week_start === monday);
  const past = list.filter((r) => r.week_start !== monday);
  const focusMin = (pomos ?? []).reduce((s: number, p: { duration_min: number }) => s + p.duration_min, 0);

  const stats = [
    { label: "Questões", value: answered ?? 0, extra: answered ? `${Math.round(((correct ?? 0) / answered) * 100)}% de acerto` : "" },
    { label: "Flashcards revisados", value: reviewsDone ?? 0 },
    { label: "Minutos de foco", value: focusMin },
    { label: "Tarefas concluídas", value: tasksDone ?? 0 },
    { label: "Check-ins de hábitos", value: (habitLogs ?? []).length },
  ];

  return (
    <>
      <PageHeader
        title="Revisão semanal"
        description={`Semana de ${formatDate(monday, true)} a ${formatDate(addDays(monday, 6), true)}. 15 minutos no domingo para olhar os números e ajustar o plano.`}
      />

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="num text-2xl font-semibold">{s.value}</dd>
            {s.extra && <dd className="text-xs text-muted-foreground">{s.extra}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="this-week" className="rounded-lg border bg-card p-5">
          <h2 id="this-week" className="mb-4 text-lg font-semibold">Esta semana</h2>
          <ActionForm action={saveWeeklyReview} submitLabel={current ? "Atualizar revisão" : "Salvar revisão"} resetOnSuccess={false} className="space-y-5">
            <input type="hidden" name="week_start" value={monday} />
            {QUESTIONS.map((q) => (
              <div key={q.name}>
                <label htmlFor={`wr-${q.name}`} className="field-label">{q.label}</label>
                <p className="mb-1.5 text-xs text-muted-foreground">{q.hint}</p>
                <textarea id={`wr-${q.name}`} name={q.name} rows={3} defaultValue={(current?.[q.name] as string | null) ?? ""} className="field" />
              </div>
            ))}
            <fieldset>
              <legend className="field-label">Energia na semana</legend>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex items-center gap-1.5 text-sm">
                    <input type="radio" name="energy" value={n} defaultChecked={current?.energy === n} className="accent-primary" />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
          </ActionForm>
        </section>

        <section aria-labelledby="history">
          <h2 id="history" className="mb-3 text-lg font-semibold">Semanas anteriores</h2>
          {past.length === 0 && <p className="text-sm text-muted-foreground">Suas revisões aparecem aqui.</p>}
          <ul className="space-y-3">
            {past.map((r) => (
              <li key={r.week_start} className="rounded-lg border bg-card p-4 text-sm">
                <details>
                  <summary className="cursor-pointer font-medium">
                    Semana de {formatDate(r.week_start)}{r.energy && <span className="font-normal text-muted-foreground"> · energia {r.energy}/5</span>}
                  </summary>
                  <dl className="mt-3 space-y-2">
                    {QUESTIONS.filter((q) => r[q.name]).map((q) => (
                      <div key={q.name}>
                        <dt className="text-xs text-muted-foreground">{q.label}</dt>
                        <dd className="whitespace-pre-line">{r[q.name] as string}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { requireUser } from "@/lib/auth";
import { countDueToday } from "@/lib/data/flashcards";
import { getExamsOverview } from "@/lib/data/study";
import { addDays, daysUntil, formatDate, localDate, relativeDays, startOfLocalDay, weekStart } from "@/lib/dates";
import { money } from "@/lib/finance";
import { isExamReady } from "@/lib/study";
import { cn } from "@/lib/utils";
import { QuestionsChart, type DayPoint } from "./questions-chart";
import { TodayHabits } from "./today-habits";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Hoje" };

const DAILY_QUESTIONS = 20;
const dayLabel = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const longDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" });

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  const today = localDate();
  const todayTs = startOfLocalDay(today);
  const since = addDays(today, -13);

  const [
    cards,
    exams,
    { data: profile },
    { data: attempts },
    { data: habits },
    { data: habitLogs },
    { data: pomos },
    { data: english },
    { data: milestones },
    { data: goals },
    { data: krs },
    { data: tasks },
    { data: funds },
    { data: entries },
  ] = await Promise.all([
    countDueToday(supabase, userId),
    getExamsOverview(supabase),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("attempts").select("created_at, is_correct").gte("created_at", startOfLocalDay(since)),
    supabase.from("habits").select("id, name, cue, color").eq("archived", false).order("position"),
    supabase.from("habit_logs").select("habit_id").eq("date", today),
    supabase.from("pomodoro_sessions").select("duration_min").gte("started_at", todayTs),
    supabase.from("english_activity").select("minutes").eq("date", today),
    supabase.from("milestones").select("id, title, due_date").is("done_at", null).not("due_date", "is", null).order("due_date").limit(5),
    supabase.from("goals").select("id, title, target_date").eq("status", "active").order("target_date", { nullsFirst: false }).limit(5),
    supabase.from("key_results").select("goal_id, current_value, target_value"),
    supabase.from("tasks").select("id, title, status, priority").in("status", ["doing", "todo"]).order("position").limit(6),
    supabase.from("funds").select("id, name, target_amount, currency").order("created_at").limit(1),
    supabase.from("fund_entries").select("fund_id, amount"),
  ]);

  // Questões por dia (UTC-3)
  const byDay = new Map<string, { answered: number; correct: number }>();
  for (const a of (attempts ?? []) as { created_at: string; is_correct: boolean }[]) {
    const d = localDate(new Date(a.created_at));
    const cur = byDay.get(d) ?? { answered: 0, correct: 0 };
    cur.answered++;
    if (a.is_correct) cur.correct++;
    byDay.set(d, cur);
  }
  const series: DayPoint[] = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(since, i);
    const v = byDay.get(date) ?? { answered: 0, correct: 0 };
    return { date, label: dayLabel.format(new Date(`${date}T12:00:00Z`)), ...v };
  });
  const todayQ = byDay.get(today)?.answered ?? 0;
  const weekQ = series.filter((s) => s.date >= weekStart(today)).reduce((s, d) => s + d.answered, 0);

  const doneHabits = new Set((habitLogs ?? []).map((l: { habit_id: string }) => l.habit_id));
  const habitList = (habits ?? []).map((h: { id: string; name: string; cue: string | null; color: string | null }) => ({ ...h, done: doneHabits.has(h.id) }));
  const focusMin = (pomos ?? []).reduce((s: number, p: { duration_min: number }) => s + p.duration_min, 0);
  const englishMin = (english ?? []).reduce((s: number, e: { minutes: number }) => s + e.minutes, 0);
  const cardsLeft = cards.due + cards.fresh;
  const nextMilestone = (milestones ?? [])[0] as { title: string; due_date: string } | undefined;

  const goalPct = (id: string) => {
    const list = ((krs ?? []) as { goal_id: string; current_value: number; target_value: number }[]).filter((k) => k.goal_id === id);
    if (!list.length) return 0;
    return Math.round((list.reduce((s, k) => s + Math.min(1, Number(k.current_value) / Number(k.target_value)), 0) / list.length) * 100);
  };

  const fund = (funds ?? [])[0] as { id: string; name: string; target_amount: number; currency: string } | undefined;
  const fundSaved = fund ? (entries ?? []).filter((e: { fund_id: string }) => e.fund_id === fund.id).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0) : 0;

  const agenda = [
    {
      label: "Flashcards",
      value: cardsLeft,
      unit: cardsLeft === 1 ? "cartão" : "cartões",
      done: cardsLeft === 0,
      hint: cardsLeft ? `${cards.due} revisões, ${cards.fresh} novos` : "Revisão do dia feita",
      href: "/flashcards/revisar",
      cta: "Revisar",
    },
    {
      label: "Questões",
      value: `${todayQ}/${DAILY_QUESTIONS}`,
      unit: "",
      done: todayQ >= DAILY_QUESTIONS,
      hint: todayQ >= DAILY_QUESTIONS ? "Meta do dia batida" : "Misture assuntos",
      href: "/estudos",
      cta: "Praticar",
    },
    {
      label: "Inglês",
      value: englishMin,
      unit: "min",
      done: englishMin >= 30,
      hint: englishMin >= 30 ? "Meta do dia batida" : "Meta: 30 min",
      href: "/ingles",
      cta: "Registrar",
    },
    {
      label: "Foco",
      value: focusMin,
      unit: "min",
      done: focusMin >= 50,
      hint: "Blocos de 25 ou 50 min",
      href: "/gestao/foco",
      cta: "Iniciar",
    },
  ];

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-muted-foreground first-letter:uppercase">{longDate.format(new Date())}</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {greeting()}{profile?.display_name ? `, ${profile.display_name}` : ""}.
        </h1>
        {nextMilestone && (
          <p className="mt-1 text-muted-foreground">
            Próximo marco: <span className="text-foreground">{nextMilestone.title}</span>{" "}
            <span className={cn("num", daysUntil(nextMilestone.due_date) < 0 ? "text-destructive" : daysUntil(nextMilestone.due_date) <= 7 && "text-warn")}>
              ({relativeDays(nextMilestone.due_date)})
            </span>
          </p>
        )}
      </header>

      {/* A faixa do dia: o que fazer hoje, em ordem */}
      <section aria-label="Hoje" className="overflow-hidden rounded-xl bg-sidebar text-sidebar-foreground">
        <ol className="grid divide-sidebar-border sm:grid-cols-4 sm:divide-x">
          {agenda.map((a, i) => (
            <li key={a.label} className="flex flex-col gap-1 border-sidebar-border p-5 max-sm:border-b max-sm:last:border-b-0">
              <p className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                <span className="num">{i + 1}</span> {a.label}
              </p>
              <p className={cn("num text-3xl font-semibold text-white", a.done && "text-[#4cc28c]")} style={{ fontFamily: "var(--font-sora)" }}>
                {a.value}
                {a.unit && <span className="ml-1 text-base font-normal text-sidebar-foreground/70">{a.unit}</span>}
              </p>
              <p className={cn("text-xs", !a.done && i === 0 && cardsLeft ? "text-warn" : "text-sidebar-foreground/70")}>{a.hint}</p>
              {!a.done && (
                <Link href={a.href} className="mt-2 w-fit rounded-md bg-sidebar-accent px-3 py-1.5 text-sm text-white hover:bg-sidebar-primary/40 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none">
                  {a.cta}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="q-chart" className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="q-chart" className="font-semibold">Questões respondidas</h2>
              <p className="num text-sm text-muted-foreground">{weekQ} nesta semana</p>
            </div>
            <QuestionsChart data={series} />
          </section>

          <section aria-labelledby="readiness">
            <h2 id="readiness" className="mb-3 font-semibold">Preparação para as provas</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {exams.filter((e) => e.presets.length && e.total).map((e) => {
                const p = e.presets[0];
                const ready = isExamReady(p.lastScores, p.ready_pct);
                const last = p.lastScores[0];
                return (
                  <li key={e.subject.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium">{e.subject.name}</p>
                      <p className={cn("num text-sm", ready ? "text-success" : "text-muted-foreground")}>
                        {ready ? "pronto" : last !== undefined ? `último ${Math.round(last)}%` : "sem simulado"}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${e.total ? (e.mastered / e.total) * 100 : 0}%` }} />
                    </div>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {e.mastered}/{e.total} dominadas{e.accuracy !== null && ` · ${e.accuracy}% de acerto`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="goals">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="goals" className="font-semibold">Metas ativas</h2>
              <Link href="/carreira" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Ver todas</Link>
            </div>
            <ul className="divide-y rounded-lg border bg-card">
              {((goals ?? []) as { id: string; title: string; target_date: string | null }[]).map((g) => {
                const pct = goalPct(g.id);
                return (
                  <li key={g.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{g.title}</p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <p className="num w-10 text-right text-sm">{pct}%</p>
                    {g.target_date && <p className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{formatDate(g.target_date, true)}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="habits-today">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="habits-today" className="font-semibold">Hábitos de hoje</h2>
              <p className="num text-sm text-muted-foreground">{habitList.filter((h) => h.done).length}/{habitList.length}</p>
            </div>
            <TodayHabits habits={habitList} today={today} />
          </section>

          <section aria-labelledby="doing">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="doing" className="font-semibold">Em andamento</h2>
              <Link href="/gestao" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Quadro</Link>
            </div>
            <ul className="space-y-1.5 text-sm">
              {((tasks ?? []) as { id: string; title: string; status: string; priority: number }[]).map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.status === "doing" ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
                  <span>{t.title}{t.status === "doing" && <span className="sr-only"> (fazendo)</span>}</span>
                </li>
              ))}
              {(tasks ?? []).length === 0 && <li className="text-muted-foreground">Nada em andamento. Escolha algo da semana.</li>}
            </ul>
          </section>

          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className="mb-2 font-semibold">Próximos marcos</h2>
            <ul className="space-y-2 text-sm">
              {((milestones ?? []) as { id: string; title: string; due_date: string }[]).map((m) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span>{m.title}</span>
                  <span className={cn("num shrink-0 text-xs", m.due_date < today ? "text-destructive" : "text-muted-foreground")}>{formatDate(m.due_date, true)}</span>
                </li>
              ))}
            </ul>
          </section>

          {fund && (
            <section aria-labelledby="fund" className="rounded-lg border bg-card p-4">
              <h2 id="fund" className="text-sm text-muted-foreground">{fund.name}</h2>
              <p className="num mt-1 text-xl font-semibold">
                {money(fundSaved, fund.currency)} <span className="text-sm font-normal text-muted-foreground">de {money(Number(fund.target_amount), fund.currency)}</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, (fundSaved / Number(fund.target_amount)) * 100)}%` }} />
              </div>
              <LinkButton href="/financas" variant="link" size="sm" className="mt-1 px-0">Registrar aporte</LinkButton>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

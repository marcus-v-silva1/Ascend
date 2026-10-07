import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/action-form";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { addDays, formatDate, localDate, weekStart } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { addVocab, importTimesData, logActivity, setUnitStatus } from "./actions";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Inglês" };

const KIND_LABEL: Record<string, string> = {
  lesson: "Lição na plataforma",
  class: "Aula com professor",
  listening: "Listening",
  speaking: "Conversação",
  reading: "Leitura",
  writing: "Escrita",
  vocab: "Vocabulário",
};
const PLATFORM_LABEL: Record<string, string> = {
  times_digital_books: "Times Digital Books",
  times_connected: "Times Connected",
  other: "Outra",
};

type Unit = { id: string; course_id: string; title: string; position: number; status: "todo" | "doing" | "done"; score: number | null };
type Course = { id: string; platform: string; title: string; level: string | null; synced_at: string | null };

export default async function EnglishPage() {
  const { supabase } = await requireUser();
  const today = localDate();
  const monday = weekStart(today);
  const since = addDays(monday, -49);

  const [{ data: activity }, { data: allActivity }, { data: courses }, { data: units }, { data: decks }, { data: goal }] = await Promise.all([
    supabase.from("english_activity").select("date, kind, minutes, note").gte("date", since).order("date", { ascending: false }),
    supabase.from("english_activity").select("minutes"),
    supabase.from("english_courses").select("id, platform, title, level, synced_at").order("created_at"),
    supabase.from("english_units").select("id, course_id, title, position, status, score").order("position"),
    supabase.from("decks").select("id, external_id").in("external_id", ["d-vocab", "d-interview"]),
    supabase.from("goals").select("target_date").eq("external_id", "g-en-b2").maybeSingle(),
  ]);

  type A = { date: string; kind: string; minutes: number; note: string | null };
  const recent = (activity ?? []) as A[];
  const totalMin = (allActivity ?? []).reduce((s: number, a: { minutes: number }) => s + a.minutes, 0);
  const weekMin = recent.filter((a) => a.date >= monday).reduce((s, a) => s + a.minutes, 0);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(monday, (i - 7) * 7));
  const perWeek = weeks.map((w) => ({
    week: w,
    minutes: recent.filter((a) => a.date >= w && a.date < addDays(w, 7)).reduce((s, a) => s + a.minutes, 0),
  }));
  const maxWeek = Math.max(150, ...perWeek.map((w) => w.minutes));
  const targetHours = 300;
  const hours = Math.floor(totalMin / 60);
  const deckId = (ext: string) => (decks ?? []).find((d) => d.external_id === ext)?.id;
  const unitList = (units ?? []) as Unit[];

  return (
    <>
      <PageHeader
        title="Inglês"
        description={`Meta B2 sólido${goal?.target_date ? ` até ${formatDate(goal.target_date)}` : ""}. Constância vence intensidade: 30 minutos todo dia valem mais que 4 horas no sábado.`}
        actions={
          <>
            {deckId("d-vocab") && <LinkButton href={`/flashcards/revisar?deck=${deckId("d-vocab")}`} variant="outline">Revisar vocabulário</LinkButton>}
            {deckId("d-interview") && <LinkButton href={`/flashcards/revisar?deck=${deckId("d-interview")}`}>Treinar entrevista</LinkButton>}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Horas acumuladas</p>
          <p className="num text-3xl font-semibold" style={{ fontFamily: "var(--font-sora)" }}>{hours}<span className="text-base font-normal text-muted-foreground">/{targetHours}h</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-muted" aria-hidden><div className="h-full rounded-full bg-warn" style={{ width: `${Math.min(100, (hours / targetHours) * 100)}%` }} /></div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Esta semana</p>
          <p className="num text-3xl font-semibold" style={{ fontFamily: "var(--font-sora)" }}>{weekMin}<span className="text-base font-normal text-muted-foreground"> min</span></p>
          <p className="text-xs text-muted-foreground">Meta sugerida: 210 min (30/dia)</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="mb-2 text-sm text-muted-foreground">Últimas 8 semanas</p>
          <div className="flex h-16 items-end gap-1.5" role="img" aria-label={`Minutos por semana: ${perWeek.map((w) => w.minutes).join(", ")}`}>
            {perWeek.map((w) => (
              <div key={w.week} className="flex-1 rounded-t bg-warn/80" style={{ height: `${Math.max(4, (w.minutes / maxWeek) * 100)}%`, opacity: w.week === monday ? 1 : 0.6 }} title={`${formatDate(w.week, true)}: ${w.minutes} min`} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="courses">
            <h2 id="courses" className="mb-3 text-xl font-semibold">Plataformas Times</h2>
            {(courses ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm">
                <p className="font-medium">Ainda sem dados da Times Digital Books e Times Connected.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>No seu computador, rode <code>npm run times:sync</code> na pasta do projeto.</li>
                  <li>Faça login nas duas plataformas na janela que abrir (a senha fica só no navegador, nunca no código).</li>
                  <li>O script gera <code>times-export.json</code>. Envie o arquivo abaixo.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4">
                {((courses ?? []) as Course[]).map((c) => {
                  const mine = unitList.filter((u) => u.course_id === c.id);
                  const done = mine.filter((u) => u.status === "done").length;
                  const next = mine.find((u) => u.status !== "done");
                  return (
                    <article key={c.id} className="rounded-lg border bg-card p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">{PLATFORM_LABEL[c.platform]}{c.level && ` · ${c.level}`}</p>
                          <h3 className="font-semibold">{c.title}</h3>
                        </div>
                        <p className="num text-sm text-muted-foreground">{done}/{mine.length} unidades</p>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted" aria-hidden><div className="h-full rounded-full bg-primary" style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} /></div>
                      {next && <p className="mt-2 text-sm">Próxima: <span className="font-medium">{next.title}</span></p>}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-muted-foreground">Todas as unidades</summary>
                        <ul className="mt-2 divide-y text-sm">
                          {mine.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-3 py-1.5">
                              <span className={cn(u.status === "done" && "text-muted-foreground line-through")}>{u.title}{u.score !== null && <span className="num text-xs text-muted-foreground"> · {Number(u.score)}%</span>}</span>
                              <form action={setUnitStatus} className="flex items-center gap-1">
                                <input type="hidden" name="id" value={u.id} />
                                <select name="status" defaultValue={u.status} aria-label={`Status de ${u.title}`} className="field h-7 w-auto py-0 text-xs">
                                  <option value="todo">A fazer</option>
                                  <option value="doing">Fazendo</option>
                                  <option value="done">Feita</option>
                                </select>
                                <button type="submit" className="text-xs text-primary">ok</button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      </details>
                      {c.synced_at && <p className="mt-2 text-xs text-muted-foreground">Sincronizado em {formatDate(c.synced_at)}</p>}
                    </article>
                  );
                })}
              </div>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">Importar times-export.json</summary>
              <ActionForm action={importTimesData} submitLabel="Importar" submitVariant="secondary" className="mt-2 space-y-2">
                <input type="file" name="file" accept="application/json,.json" aria-label="Arquivo exportado" className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" />
              </ActionForm>
            </details>
          </section>

          <section aria-labelledby="log">
            <h2 id="log" className="mb-3 text-xl font-semibold">Registro</h2>
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {recent.slice(0, 12).map((a, i) => (
                <li key={i} className="flex justify-between gap-3 px-4 py-2">
                  <span>{KIND_LABEL[a.kind]}{a.note && <span className="text-muted-foreground"> · {a.note}</span>}</span>
                  <span className="num shrink-0 text-muted-foreground">{a.minutes} min · {formatDate(a.date, true)}</span>
                </li>
              ))}
              {recent.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Registre a primeira sessão ao lado.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="new-activity" className="rounded-lg border bg-card p-5">
            <h2 id="new-activity" className="mb-4 text-lg font-semibold">Registrar prática</h2>
            <ActionForm action={logActivity} submitLabel="Registrar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="en-kind" className="field-label">Tipo</label>
                  <select id="en-kind" name="kind" defaultValue="lesson" className="field">
                    {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <Field label="Minutos" name="minutes" type="number" min={1} max={600} defaultValue={30} required />
              </div>
              <Field label="Data" name="date" type="date" defaultValue={today} required />
              <Field label="O que fez" name="note" placeholder="Ex.: Unit 4 — present perfect" />
            </ActionForm>
            <p className="mt-3 text-xs text-muted-foreground">20 minutos ou mais já marcam o hábito “Inglês 30 min” do dia.</p>
          </section>

          <section aria-labelledby="vocab" className="rounded-lg border bg-card p-5">
            <h2 id="vocab" className="mb-1 text-lg font-semibold">Palavra nova</h2>
            <p className="mb-4 text-sm text-muted-foreground">Vira flashcard na hora. Anote com um exemplo de frase.</p>
            <ActionForm action={addVocab} submitLabel="Adicionar">
              <Field label="Palavra ou expressão" name="word" required placeholder="to follow up" />
              <Field label="Significado" name="meaning" required placeholder="dar retorno, acompanhar" />
              <Field label="Exemplo" name="example" placeholder="I'll follow up with the recruiter tomorrow." />
            </ActionForm>
          </section>
        </aside>
      </div>
    </>
  );
}

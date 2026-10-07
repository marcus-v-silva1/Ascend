import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { addDays, localDate, startOfLocalDay, weekStart } from "@/lib/dates";
import { Pomodoro } from "./pomodoro";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Foco" };

function hours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m} min`;
}

export default async function FocusPage() {
  const { supabase } = await requireUser();
  const today = localDate();
  const monday = weekStart(today);

  const [{ data: subjects }, { data: sessions }] = await Promise.all([
    supabase.from("subjects").select("id, name, kind, parent_id").order("position"),
    supabase
      .from("pomodoro_sessions")
      .select("duration_min, started_at, subject_id, label, subjects(name)")
      .gte("started_at", startOfLocalDay(addDays(monday, -21)))
      .order("started_at", { ascending: false }),
  ]);

  type S = { id: string; name: string; kind: string; parent_id: string | null };
  const list = (subjects ?? []) as S[];
  const byId = new Map(list.map((s) => [s.id, s]));
  const options = list
    .filter((s) => s.kind !== "topic")
    .map((s) => ({ id: s.id, label: s.parent_id ? `${byId.get(s.parent_id)?.name} › ${s.name}` : s.name }));

  type P = { duration_min: number; started_at: string; label: string | null; subjects: { name: string } | null };
  const rows = (sessions ?? []) as unknown as P[];
  const todayStart = startOfLocalDay(today);
  const weekStartTs = startOfLocalDay(monday);
  const todayMin = rows.filter((r) => r.started_at >= todayStart).reduce((s, r) => s + r.duration_min, 0);
  const weekRows = rows.filter((r) => r.started_at >= weekStartTs);
  const weekMin = weekRows.reduce((s, r) => s + r.duration_min, 0);
  const bySubject = new Map<string, number>();
  for (const r of weekRows) {
    const k = r.subjects?.name ?? "Sem assunto";
    bySubject.set(k, (bySubject.get(k) ?? 0) + r.duration_min);
  }

  return (
    <>
      <PageHeader title="Foco" description="Blocos de 25 ou 50 minutos sem celular, com pausa curta. Cada bloco concluído é registrado no assunto escolhido." />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Pomodoro subjects={options} />
        <aside className="space-y-6">
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-4">
              <dt className="text-sm text-muted-foreground">Hoje</dt>
              <dd className="num text-2xl font-semibold">{hours(todayMin)}</dd>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <dt className="text-sm text-muted-foreground">Esta semana</dt>
              <dd className="num text-2xl font-semibold">{hours(weekMin)}</dd>
            </div>
          </dl>
          {bySubject.size > 0 && (
            <section aria-labelledby="by-subj">
              <h2 id="by-subj" className="mb-2 text-sm font-medium">Na semana, por assunto</h2>
              <ul className="space-y-2">
                {[...bySubject.entries()].sort((a, b) => b[1] - a[1]).map(([name, min]) => (
                  <li key={name} className="text-sm">
                    <div className="flex justify-between"><span>{name}</span><span className="num text-muted-foreground">{hours(min)}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(min / weekMin) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {rows.length > 0 && (
            <section aria-labelledby="recent">
              <h2 id="recent" className="mb-2 text-sm font-medium">Últimos blocos</h2>
              <ul className="divide-y rounded-lg border bg-card text-sm">
                {rows.slice(0, 8).map((r) => (
                  <li key={r.started_at} className="flex justify-between gap-3 px-3 py-2">
                    <span className="truncate">{r.label ?? r.subjects?.name ?? "Foco"}</span>
                    <span className="num shrink-0 text-muted-foreground">
                      {r.duration_min} min · {new Date(r.started_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

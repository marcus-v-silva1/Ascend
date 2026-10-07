import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { localDate } from "@/lib/dates";
import { lastNDays } from "@/lib/habits";
import { archiveHabit, createHabit } from "../actions";
import { HabitGrid, type HabitRow } from "./habit-grid";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Hábitos" };

export default async function HabitsPage() {
  const { supabase } = await requireUser();
  const today = localDate();
  const days = lastNDays(today, 14);
  const since = lastNDays(today, 120)[0];

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from("habits").select("id, name, cue, target_per_week, color").eq("archived", false).order("position"),
    supabase.from("habit_logs").select("habit_id, date").gte("date", since),
  ]);

  const rows: HabitRow[] = (habits ?? []).map((h: Omit<HabitRow, "done">) => ({
    ...h,
    done: (logs ?? []).filter((l: { habit_id: string }) => l.habit_id === h.id).map((l: { date: string }) => l.date),
  }));

  return (
    <>
      <PageHeader
        title="Hábitos"
        description="Cada hábito tem um gatilho: algo que você já faz e que dispara o novo. Marque o quadrado do dia ao terminar."
      />
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        {rows.length ? <HabitGrid habits={rows} days={days} today={today} /> : <p className="py-6 text-center text-muted-foreground">Nenhum hábito ainda.</p>}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="new-habit" className="rounded-lg border bg-card p-5">
          <h2 id="new-habit" className="mb-4 text-lg font-semibold">Novo hábito</h2>
          <ActionForm action={createHabit} submitLabel="Criar hábito">
            <Field label="Hábito" name="name" required placeholder="Ex.: Ler 10 páginas" />
            <Field label="Gatilho (depois de…)" name="cue" placeholder="Ex.: Depois de escovar os dentes à noite" />
            <Field label="Vezes por semana" name="target_per_week" type="number" min={1} max={7} defaultValue={5} required />
          </ActionForm>
        </section>
        {rows.length > 0 && (
          <section aria-labelledby="archive">
            <h2 id="archive" className="mb-3 text-lg font-semibold">Arquivar</h2>
            <p className="mb-3 text-sm text-muted-foreground">Arquivar esconde o hábito e mantém o histórico.</p>
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {rows.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-4 py-2">
                  {h.name}
                  <form action={archiveHabit}>
                    <input type="hidden" name="id" value={h.id} />
                    <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">arquivar</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

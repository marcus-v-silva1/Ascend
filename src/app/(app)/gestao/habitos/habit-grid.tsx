"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Flame } from "lucide-react";
import { toast } from "sonner";
import { countThisWeek, currentStreak } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { toggleHabit } from "../actions";

export type HabitRow = { id: string; name: string; cue: string | null; target_per_week: number; color: string | null; done: string[] };

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow", timeZone: "UTC" });

export function HabitGrid({ habits, days, today }: { habits: HabitRow[]; days: string[]; today: string }) {
  const [, startTransition] = useTransition();
  const [optimistic, toggle] = useOptimistic(habits, (state, { habitId, date }: { habitId: string; date: string }) =>
    state.map((h) =>
      h.id !== habitId ? h : { ...h, done: h.done.includes(date) ? h.done.filter((d) => d !== date) : [...h.done, date] },
    ),
  );

  function onToggle(habitId: string, date: string) {
    startTransition(async () => {
      toggle({ habitId, date });
      try {
        await toggleHabit({ habitId, date });
      } catch {
        toast.error("Não foi possível salvar.");
      }
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[40rem] border-separate border-spacing-y-1">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="text-left font-normal">Hábito</th>
            {days.map((d) => (
              <th key={d} scope="col" className={cn("w-8 font-normal", d === today && "text-foreground")}>
                <span className="block">{weekday.format(new Date(`${d}T12:00:00Z`))}</span>
                <span className="num block">{d.slice(8)}</span>
              </th>
            ))}
            <th scope="col" className="w-20 text-right font-normal">Semana</th>
            <th scope="col" className="w-16 text-right font-normal">Sequência</th>
          </tr>
        </thead>
        <tbody>
          {optimistic.map((h) => {
            const done = new Set(h.done);
            const week = countThisWeek(done, today);
            const streak = currentStreak(done, today);
            return (
              <tr key={h.id}>
                <th scope="row" className="pr-3 text-left font-normal">
                  <p className="text-sm font-medium">{h.name}</p>
                  {h.cue && <p className="text-xs text-muted-foreground">{h.cue}</p>}
                </th>
                {days.map((d) => {
                  const on = done.has(d);
                  return (
                    <td key={d} className="text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(h.id, d)}
                        aria-pressed={on}
                        aria-label={`${h.name} em ${d}`}
                        className={cn(
                          "grid size-7 place-items-center rounded-md border transition-colors",
                          on ? "border-transparent text-white" : "bg-card hover:border-primary/50",
                          d === today && !on && "border-primary/60",
                        )}
                        style={on ? { background: h.color ?? "var(--primary)" } : undefined}
                      >
                        {on && <Check className="size-4" />}
                      </button>
                    </td>
                  );
                })}
                <td className={cn("num text-right text-sm", week >= h.target_per_week ? "text-success" : "text-muted-foreground")}>
                  {week}/{h.target_per_week}
                </td>
                <td className="num text-right text-sm">
                  <span className={cn("inline-flex items-center gap-1", streak >= 3 && "text-warn")}>
                    {streak >= 3 && <Flame className="size-3.5" aria-hidden />}
                    {streak}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

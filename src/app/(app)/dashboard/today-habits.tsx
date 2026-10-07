"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleHabit } from "../gestao/actions";

type Habit = { id: string; name: string; cue: string | null; color: string | null; done: boolean };

export function TodayHabits({ habits, today }: { habits: Habit[]; today: string }) {
  const [, startTransition] = useTransition();
  const [list, flip] = useOptimistic(habits, (state, id: string) => state.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));

  return (
    <ul className="space-y-1">
      {list.map((h) => (
        <li key={h.id}>
          <button
            type="button"
            aria-pressed={h.done}
            onClick={() =>
              startTransition(async () => {
                flip(h.id);
                try {
                  await toggleHabit({ habitId: h.id, date: today });
                } catch {
                  toast.error("Não foi possível salvar.");
                }
              })
            }
            className="flex w-full items-start gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted"
          >
            <span
              className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border", h.done && "border-transparent text-white")}
              style={h.done ? { background: h.color ?? "var(--primary)" } : undefined}
              aria-hidden
            >
              {h.done && <Check className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm", h.done && "text-muted-foreground line-through")}>{h.name}</span>
              {h.cue && !h.done && <span className="block truncate text-xs text-muted-foreground">{h.cue}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

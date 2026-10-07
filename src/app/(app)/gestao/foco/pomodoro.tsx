"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logPomodoro } from "../actions";

type Phase = "focus" | "break";
const PRESETS = [25, 50] as const;

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // sem áudio disponível
  }
}

export function Pomodoro({ subjects }: { subjects: { id: string; label: string }[] }) {
  const [focusMin, setFocusMin] = useState<number>(25);
  const [phase, setPhase] = useState<Phase>("focus");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(25 * 60_000);
  const [subjectId, setSubjectId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [, startTransition] = useTransition();
  const completed = useRef(false);

  const total = (phase === "focus" ? focusMin : focusMin >= 50 ? 10 : 5) * 60_000;
  const running = deadline !== null;

  // Usa o relógio de parede: funciona mesmo com a aba em segundo plano
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0 && !completed.current) {
        completed.current = true;
        setDeadline(null);
        beep();
        if (phase === "focus") {
          startTransition(async () => {
            await logPomodoro({ subjectId: subjectId || null, label: label.trim() || null, durationMin: focusMin });
            toast.success(`${focusMin} min de foco registrados. Hora da pausa.`);
          });
          setPhase("break");
          setRemaining((focusMin >= 50 ? 10 : 5) * 60_000);
        } else {
          toast("Pausa encerrada. Pronto para mais um bloco?");
          setPhase("focus");
          setRemaining(focusMin * 60_000);
        }
      }
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [deadline, phase, focusMin, subjectId, label]);

  const mm = String(Math.floor(remaining / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0");

  useEffect(() => {
    document.title = running ? `${mm}:${ss} · ${phase === "focus" ? "Foco" : "Pausa"}` : "Foco · Ascend";
  }, [running, mm, ss, phase]);

  function start() {
    completed.current = false;
    setDeadline(Date.now() + remaining);
  }
  function pause() {
    setDeadline(null);
  }
  function reset(min = focusMin) {
    setDeadline(null);
    setPhase("focus");
    setRemaining(min * 60_000);
  }

  const progress = 1 - remaining / total;

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Duração do foco" className="inline-flex rounded-md bg-muted p-1 text-sm">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={focusMin === m}
              disabled={running}
              onClick={() => {
                setFocusMin(m);
                reset(m);
              }}
              className={cn("rounded px-3 py-1.5 disabled:opacity-50", focusMin === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
            >
              {m} min
            </button>
          ))}
        </div>
        <p className={cn("text-sm font-medium", phase === "focus" ? "text-primary" : "text-success")}>{phase === "focus" ? "Foco" : "Pausa"}</p>
      </div>

      <p className="num my-10 text-center text-7xl font-semibold tracking-tight sm:text-8xl" style={{ fontFamily: "var(--font-sora)" }} aria-live="off">
        {mm}:{ss}
      </p>
      <div className="mx-auto mb-8 h-1 max-w-sm overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn("h-full", phase === "focus" ? "bg-primary" : "bg-success")} style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pomo-subject" className="field-label">Assunto</label>
          <select id="pomo-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={running} className="field">
            <option value="">Sem assunto</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pomo-label" className="field-label">No que vai focar</label>
          <input id="pomo-label" value={label} onChange={(e) => setLabel(e.target.value)} disabled={running} className="field" placeholder="Ex.: Scrum Guide, eventos" />
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {running ? (
          <Button size="lg" variant="secondary" onClick={pause}><Pause aria-hidden /> Pausar</Button>
        ) : (
          <Button size="lg" onClick={start}><Play aria-hidden /> {remaining < total ? "Continuar" : phase === "focus" ? "Começar foco" : "Começar pausa"}</Button>
        )}
        <Button size="lg" variant="ghost" onClick={() => reset()} aria-label="Reiniciar"><RotateCcw aria-hidden /></Button>
      </div>
    </div>
  );
}

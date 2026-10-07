"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { finishSession, saveWhyWrong, submitPracticeAnswer } from "../../actions";

export type RunnerQuestion = {
  id: string;
  type: "single" | "multi" | "truefalse";
  stem: string;
  options: { id: string; text: string }[];
  choose: number;
  subject: string | null;
};

type Feedback = { isCorrect: boolean; correct: string[]; explanation: string | null; attemptId: string | null };

function formatClock(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionRunner({
  sessionId,
  mode,
  questions,
  durationMin,
  startedAt,
  alreadyAnswered,
}: {
  sessionId: string;
  mode: "practice" | "mock";
  questions: RunnerQuestion[];
  durationMin: number | null;
  startedAt: string;
  alreadyAnswered: string[];
}) {
  const storageKey = `glowup:session:${sessionId}`;
  const [index, setIndex] = useState(() => {
    if (mode !== "practice") return 0;
    const done = new Set(alreadyAnswered);
    const first = questions.findIndex((q) => !done.has(q.id));
    return first === -1 ? 0 : first;
  });
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [why, setWhy] = useState("");
  const [savedWhy, setSavedWhy] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const questionStart = useRef(Date.now());
  const finishing = useRef(false);

  const q = questions[index];
  const current = selected[q?.id] ?? [];
  const fb = q ? feedback[q.id] : undefined;
  const deadline = durationMin ? new Date(startedAt).getTime() + durationMin * 60_000 : null;
  const answeredCount = mode === "mock"
    ? Object.values(selected).filter((s) => s.length > 0).length
    : Object.keys(feedback).length + alreadyAnswered.length;

  // Simulado: respostas sobrevivem a recarregar a página
  useEffect(() => {
    if (mode !== "mock") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { selected: Record<string, string[]>; times: Record<string, number>; flagged: string[] };
        setSelected(saved.selected ?? {});
        setTimes(saved.times ?? {});
        setFlagged(new Set(saved.flagged ?? []));
      }
    } catch {
      // armazenamento indisponível: segue sem restaurar
    }
  }, [mode, storageKey]);

  useEffect(() => {
    if (mode !== "mock") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ selected, times, flagged: [...flagged] }));
    } catch {
      // ignora
    }
  }, [mode, storageKey, selected, times, flagged]);

  const trackTime = useCallback(() => {
    if (!q) return 0;
    const spent = Date.now() - questionStart.current;
    questionStart.current = Date.now();
    const total = (times[q.id] ?? 0) + spent;
    setTimes((t) => ({ ...t, [q.id]: total }));
    return total;
  }, [q, times]);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    trackTime();
    const answers = mode === "mock"
      ? questions.map((qq) => ({ questionId: qq.id, selected: selected[qq.id] ?? [], timeMs: Math.round(times[qq.id] ?? 0) }))
      : [];
    startTransition(async () => {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignora
      }
      try {
        const { url } = await finishSession({ sessionId, answers });
        router.replace(url);
      } catch {
        finishing.current = false;
        toast.error("Não foi possível encerrar. Verifique a conexão e tente de novo.");
      }
    });
  }, [mode, questions, selected, times, sessionId, storageKey, trackTime, router]);

  // Relógio do simulado; encerra sozinho quando o tempo acaba
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  useEffect(() => {
    if (deadline && now >= deadline) finish();
  }, [deadline, now, finish]);

  const toggle = useCallback(
    (optionId: string) => {
      if (!q || fb) return;
      setSelected((s) => {
        const prev = s[q.id] ?? [];
        if (q.type !== "multi") return { ...s, [q.id]: [optionId] };
        return { ...s, [q.id]: prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId] };
      });
    },
    [q, fb],
  );

  const go = useCallback(
    (next: number) => {
      trackTime();
      setWhy("");
      setIndex(Math.max(0, Math.min(questions.length - 1, next)));
    },
    [questions.length, trackTime],
  );

  const submitPractice = useCallback(() => {
    if (!q || current.length === 0 || fb) return;
    const timeMs = Math.round(trackTime());
    startTransition(async () => {
      try {
        const res = await submitPracticeAnswer({ sessionId, questionId: q.id, selected: current, timeMs });
        setFeedback((f) => ({ ...f, [q.id]: res }));
      } catch {
        toast.error("Não foi possível corrigir. Tente de novo.");
      }
    });
  }, [q, current, fb, sessionId, trackTime]);

  // Atalhos: 1–9 marcam alternativas, Enter confirma/avança
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      const n = Number(e.key);
      if (q && n >= 1 && n <= q.options.length) toggle(q.options[n - 1].id);
      if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "practice" && !fb) submitPractice();
        else if (index < questions.length - 1) go(index + 1);
      }
      if (e.key === "ArrowRight" && (mode === "mock" || fb)) go(index + 1);
      if (e.key === "ArrowLeft" && mode === "mock") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, fb, mode, index, questions.length, toggle, submitPractice, go]);

  const isLast = index === questions.length - 1;
  const remaining = deadline ? deadline - now : null;
  const lowTime = remaining !== null && remaining < 5 * 60_000;

  const optionState = useMemo(() => {
    return (optionId: string) => {
      if (!fb) return current.includes(optionId) ? "selected" : "idle";
      if (fb.correct.includes(optionId)) return "correct";
      if (current.includes(optionId)) return "wrong";
      return "idle";
    };
  }, [fb, current]);

  if (!q) {
    return <p className="text-muted-foreground">Esta sessão não tem questões.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-lg sm:px-0">
        <p className="num text-sm font-medium">
          {index + 1} <span className="text-muted-foreground">de {questions.length}</span>
        </p>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
        {remaining !== null && (
          <p className={cn("num text-sm font-medium", lowTime && "text-destructive")} aria-live="polite">
            {formatClock(remaining)}
          </p>
        )}
        <Button size="sm" variant="outline" onClick={finish} disabled={pending}>
          Encerrar
        </Button>
      </div>

      <article aria-labelledby="stem">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {q.subject && <span>{q.subject}</span>}
          {q.type === "multi" && <span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground">Escolha {q.choose}</span>}
          {q.type === "truefalse" && <span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground">Certo ou errado</span>}
        </div>
        <h1 id="stem" className="text-lg leading-relaxed font-medium whitespace-pre-line sm:text-xl" style={{ fontFamily: "var(--font-plex)" }}>
          {q.stem}
        </h1>

        <ul className="mt-6 space-y-2" role={q.type === "multi" ? "group" : "radiogroup"}>
          {q.options.map((o, i) => {
            const st = optionState(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role={q.type === "multi" ? "checkbox" : "radio"}
                  aria-checked={current.includes(o.id)}
                  onClick={() => toggle(o.id)}
                  disabled={!!fb}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    st === "selected" && "border-primary bg-accent",
                    st === "correct" && "border-success bg-success/10",
                    st === "wrong" && "border-destructive bg-destructive/10",
                    st === "idle" && !fb && "hover:border-primary/50",
                  )}
                >
                  <span
                    className={cn(
                      "num mt-0.5 grid size-6 shrink-0 place-items-center border text-xs",
                      q.type === "multi" ? "rounded" : "rounded-full",
                      st === "selected" && "border-primary bg-primary text-primary-foreground",
                      st === "correct" && "border-success bg-success text-white",
                      st === "wrong" && "border-destructive bg-destructive text-white",
                    )}
                    aria-hidden
                  >
                    {st === "correct" ? <Check className="size-3.5" /> : st === "wrong" ? <X className="size-3.5" /> : i + 1}
                  </span>
                  <span className="leading-relaxed">{o.text}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {fb && (
          <div
            className={cn("mt-6 rounded-lg border p-4", fb.isCorrect ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}
            role="status"
          >
            <p className={cn("font-medium", fb.isCorrect ? "text-success" : "text-destructive")}>
              {fb.isCorrect ? "Correto" : "Incorreto"}
            </p>
            {fb.explanation && <p className="mt-1 leading-relaxed">{fb.explanation}</p>}
            {!fb.isCorrect && fb.attemptId && !savedWhy.has(q.id) && (
              <form
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (why.trim().length < 3) return;
                  startTransition(async () => {
                    await saveWhyWrong({ attemptId: fb.attemptId!, whyWrong: why });
                    setSavedWhy((s) => new Set(s).add(q.id));
                    toast.success("Anotado no seu flashcard de erros.");
                  });
                }}
              >
                <label htmlFor="why" className="field-label">Por que você errou? Explique com suas palavras.</label>
                <textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} rows={2} className="field" placeholder="Ex.: confundi quem dimensiona os itens: são os Developers, não o PO." />
                <Button type="submit" size="sm" variant="secondary" disabled={pending || why.trim().length < 3}>
                  Salvar no flashcard
                </Button>
              </form>
            )}
          </div>
        )}
      </article>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {mode === "mock" ? (
          <>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0}>Anterior</Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setFlagged((f) => {
                    const n = new Set(f);
                    if (n.has(q.id)) n.delete(q.id);
                    else n.add(q.id);
                    return n;
                  })
                }
                aria-pressed={flagged.has(q.id)}
              >
                <Flag className={cn("size-4", flagged.has(q.id) && "fill-warn text-warn")} aria-hidden />
                {flagged.has(q.id) ? "Marcada" : "Marcar para revisar"}
              </Button>
            </div>
            {isLast ? (
              <Button onClick={finish} disabled={pending}>Entregar simulado</Button>
            ) : (
              <Button onClick={() => go(index + 1)}>Próxima</Button>
            )}
          </>
        ) : (
          <>
            <span className="hidden text-xs text-muted-foreground sm:inline">Teclas 1–{q.options.length} marcam · Enter confirma</span>
            {!fb ? (
              <Button onClick={submitPractice} disabled={pending || current.length === 0}>Responder</Button>
            ) : isLast ? (
              <Button onClick={finish} disabled={pending}>Ver resultado</Button>
            ) : (
              <Button onClick={() => go(index + 1)}>Próxima</Button>
            )}
          </>
        )}
      </div>

      {mode === "mock" && (
        <nav aria-label="Ir para questão" className="mt-8 grid grid-cols-10 gap-1.5 sm:grid-cols-16">
          {questions.map((qq, i) => {
            const done = (selected[qq.id] ?? []).length > 0;
            return (
              <button
                key={qq.id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Questão ${i + 1}${done ? ", respondida" : ""}${flagged.has(qq.id) ? ", marcada" : ""}`}
                className={cn(
                  "num relative h-8 rounded text-xs",
                  i === index ? "bg-primary text-primary-foreground" : done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
                {flagged.has(qq.id) && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-warn" aria-hidden />}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SessionLoader } from "./session-loader";
import type { RunnerQuestion } from "./session-runner";

export const metadata: Metadata = { title: "Sessão de estudo" };

export default async function SessionPage({ params }: PageProps<"/estudos/sessao/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id, mode, question_ids, duration_min, pass_pct, started_at, finished_at")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();
  if (session.finished_at) redirect(`/estudos/sessao/${id}/resultado`);

  const ids = session.question_ids as string[];
  // Gabarito e explicação ficam no servidor; o cliente só recebe enunciado e alternativas.
  const { data: rows } = await supabase
    .from("questions")
    .select("id, type, stem, options, correct, subjects(name)")
    .in("id", ids);

  const byId = new Map((rows ?? []).map((q: { id: string }) => [q.id, q]));
  const questions: RunnerQuestion[] = ids.flatMap((qid) => {
    const q = byId.get(qid) as
      | { id: string; type: RunnerQuestion["type"]; stem: string; options: RunnerQuestion["options"]; correct: string[]; subjects: { name: string } | null }
      | undefined;
    if (!q) return [];
    return [{ id: q.id, type: q.type, stem: q.stem, options: q.options, choose: q.correct.length, subject: q.subjects?.name ?? null }];
  });

  // Prática retomada: questões já respondidas ficam marcadas
  const { data: answered } = await supabase
    .from("attempts")
    .select("question_id")
    .eq("session_id", id);

  return (
    <SessionLoader
      sessionId={session.id}
      mode={session.mode as "practice" | "mock"}
      questions={questions}
      durationMin={session.duration_min}
      startedAt={session.started_at}
      alreadyAnswered={(answered ?? []).map((a: { question_id: string }) => a.question_id)}
    />
  );
}

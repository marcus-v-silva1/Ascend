import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuestionProgress, getSubjects } from "@/lib/data/study";
import { computeRoadmap, type ProgressContext, type RoadmapNodeInput } from "@/lib/roadmap";
import { descendantIds, isMastered } from "@/lib/study";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type RoadmapNodeRow = Database["public"]["Tables"]["roadmap_nodes"]["Row"];

const pct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

/** Reúne o progresso de tudo que um nó do roadmap pode referenciar. */
export async function getProgressContext(supabase: Client): Promise<ProgressContext> {
  const [subjects, progress, goalsRes, krsRes, msRes, unitsRes, fundsRes, entriesRes] = await Promise.all([
    getSubjects(supabase),
    getQuestionProgress(supabase),
    supabase.from("goals").select("id, external_id, status"),
    supabase.from("key_results").select("goal_id, external_id, current_value, target_value"),
    supabase.from("milestones").select("external_id, done_at"),
    supabase.from("english_units").select("external_ref, score, status"),
    supabase.from("funds").select("id, external_id, target_amount"),
    supabase.from("fund_entries").select("fund_id, amount"),
  ]);

  // Assunto: % de questões dominadas no assunto e nos subassuntos
  const subject = new Map<string, number>();
  for (const s of subjects) {
    if (!s.external_id) continue;
    const ids = new Set(descendantIds(subjects, s.id));
    const qs = progress.filter((q) => q.subject_id && ids.has(q.subject_id));
    subject.set(s.external_id, pct(qs.filter(isMastered).length, qs.length));
  }

  const key_result = new Map<string, number>();
  const krByGoal = new Map<string, number[]>();
  for (const kr of krsRes.data ?? []) {
    const value = Math.min(100, pct(Number(kr.current_value), Number(kr.target_value)));
    if (kr.external_id) key_result.set(kr.external_id, value);
    krByGoal.set(kr.goal_id, [...(krByGoal.get(kr.goal_id) ?? []), value]);
  }

  const goal = new Map<string, number>();
  for (const g of goalsRes.data ?? []) {
    if (!g.external_id) continue;
    const values = krByGoal.get(g.id) ?? [];
    const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
    goal.set(g.external_id, g.status === "done" ? 100 : avg);
  }

  const milestone = new Map<string, number>();
  for (const m of msRes.data ?? []) if (m.external_id) milestone.set(m.external_id, m.done_at ? 100 : 0);

  const english_unit = new Map<string, number>();
  for (const u of unitsRes.data ?? []) {
    if (!u.external_ref) continue;
    const value = u.status === "done" ? 100 : Number(u.score ?? 0);
    english_unit.set(u.external_ref, Math.max(english_unit.get(u.external_ref) ?? 0, value));
  }

  const fund = new Map<string, number>();
  for (const f of fundsRes.data ?? []) {
    if (!f.external_id) continue;
    const saved = (entriesRes.data ?? []).filter((e) => e.fund_id === f.id).reduce((s, e) => s + Number(e.amount), 0);
    fund.set(f.external_id, Math.min(100, pct(saved, Number(f.target_amount))));
  }

  return { subject, goal, key_result, milestone, english_unit, fund };
}

export async function getRoadmap(supabase: Client, roadmap: string) {
  const [{ data }, ctx] = await Promise.all([
    supabase.from("roadmap_nodes").select("*").eq("roadmap", roadmap).order("position"),
    getProgressContext(supabase),
  ]);
  const nodes = (data ?? []) as (RoadmapNodeRow & RoadmapNodeInput)[];
  return computeRoadmap(nodes, ctx);
}

export type ComputedRoadmapNode = Awaited<ReturnType<typeof getRoadmap>>[number];

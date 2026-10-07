import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DECKS } from "@/content/decks";
import {
  FUNDS,
  GOALS,
  HABITS,
  MILESTONES,
  PLANNED_COSTS,
  TARGETS,
  TASKS,
  TRACKS,
} from "@/content/plan";
import { COBIT_QUESTIONS, ITIL_QUESTIONS } from "@/content/questions/cobit-itil";
import { CONCURSO_QUESTIONS, ISTQB_QUESTIONS } from "@/content/questions/istqb-concursos";
import { PSM_QUESTIONS } from "@/content/questions/psm";
import { ROADMAP_NODES } from "@/content/roadmap";
import { PRESETS, SUBJECTS } from "@/content/subjects";
import { toQuestionRow } from "@/content/types";
import type { Database } from "@/lib/supabase/database.types";

/** Aumente quando adicionar conteúdo novo em src/content para ele chegar ao banco. */
export const CONTENT_VERSION = 3;

export const ALL_QUESTIONS = [
  ...PSM_QUESTIONS,
  ...COBIT_QUESTIONS,
  ...ITIL_QUESTIONS,
  ...ISTQB_QUESTIONS,
  ...CONCURSO_QUESTIONS,
];

type Client = SupabaseClient<Database>;
type IdMap = Map<string, string>;

// Os helpers genéricos recebem o nome da tabela em tempo de execução; usam o cliente sem tipos.
const untyped = (supabase: Client) => supabase as unknown as SupabaseClient;

async function idMap(supabase: Client, table: string): Promise<IdMap> {
  const { data, error } = await untyped(supabase).from(table).select("id, external_id").not("external_id", "is", null);
  if (error) throw error;
  return new Map((data ?? []).map((r: { id: string; external_id: string }) => [r.external_id, r.id]));
}

/** Insere apenas linhas cujo external_id ainda não existe (preserva edições do usuário). */
async function insertMissing(supabase: Client, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await untyped(supabase)
    .from(table)
    // defaultToNull: false faz colunas ausentes em algumas linhas usarem o default do banco
    .upsert(rows, { onConflict: "user_id,external_id", ignoreDuplicates: true, defaultToNull: false });
  if (error) throw new Error(`seed ${table}: ${error.message}`);
}

/** Preenche o assunto de questões do conteúdo inicial que ficaram sem (não mexe nas que já têm). */
async function repairQuestionSubjects(supabase: Client, subjects: IdMap) {
  const bySubject = new Map<string, string[]>();
  for (const q of ALL_QUESTIONS) bySubject.set(q.subject, [...(bySubject.get(q.subject) ?? []), q.id]);
  for (const [subject, ids] of bySubject) {
    const subjectId = subjects.get(subject);
    if (!subjectId) continue;
    const { error } = await supabase.from("questions").update({ subject_id: subjectId }).in("external_id", ids).is("subject_id", null);
    if (error) throw new Error(`seed questions/subject: ${error.message}`);
  }
}

export async function seedContent(supabase: Client, userId: string) {
  const withUser = <T extends object>(rows: T[]) => rows.map((r) => ({ ...r, user_id: userId }));

  // Assuntos em duas passadas: raízes e depois filhos (precisam do id do pai).
  await insertMissing(
    supabase,
    "subjects",
    withUser(SUBJECTS.filter((s) => !s.parent).map((s, i) => ({ external_id: s.id, name: s.name, kind: s.kind, description: s.description ?? null, position: i }))),
  );
  let subjects = await idMap(supabase, "subjects");
  await insertMissing(
    supabase,
    "subjects",
    withUser(
      SUBJECTS.filter((s) => s.parent).map((s, i) => ({
        external_id: s.id,
        name: s.name,
        kind: s.kind,
        description: s.description ?? null,
        parent_id: subjects.get(s.parent!) ?? null,
        position: i,
      })),
    ),
  );
  subjects = await idMap(supabase, "subjects");

  await insertMissing(
    supabase,
    "questions",
    withUser(ALL_QUESTIONS.map((q) => ({ ...toQuestionRow(q), subject_id: subjects.get(q.subject) ?? null }))),
  );
  await repairQuestionSubjects(supabase, subjects);

  await insertMissing(
    supabase,
    "exam_presets",
    withUser(
      PRESETS.map((p) => ({
        external_id: p.id,
        name: p.name,
        subject_id: subjects.get(p.subject) ?? null,
        question_count: p.question_count,
        duration_min: p.duration_min,
        pass_pct: p.pass_pct,
        ready_pct: p.ready_pct ?? 95,
        official_url: p.official_url ?? null,
      })),
    ),
  );

  await insertMissing(
    supabase,
    "decks",
    withUser(DECKS.map((d) => ({ external_id: d.id, name: d.name, description: d.description ?? null, subject_id: d.subject ? subjects.get(d.subject) ?? null : null }))),
  );
  const decks = await idMap(supabase, "decks");
  await insertMissing(
    supabase,
    "flashcards",
    withUser(
      DECKS.flatMap((d) =>
        d.cards.map((c) => ({
          external_id: c.id,
          deck_id: decks.get(d.id)!,
          front: c.front,
          back: c.back,
          source: d.source ?? "manual",
          tags: c.tags ?? [],
        })),
      ),
    ),
  );

  // Carreira
  await insertMissing(supabase, "tracks", withUser(TRACKS.map(({ external_id, name, description, color, icon, position }) => ({ external_id, name, description, color, icon, position }))));
  const tracks = await idMap(supabase, "tracks");

  await insertMissing(
    supabase,
    "goals",
    withUser(
      GOALS.map((g, i) => ({
        external_id: g.external_id,
        track_id: tracks.get(g.track) ?? null,
        title: g.title,
        description: g.description ?? null,
        implementation_intention: g.implementation_intention ?? null,
        target_date: g.target_date ?? null,
        position: i,
      })),
    ),
  );
  const goals = await idMap(supabase, "goals");

  await insertMissing(
    supabase,
    "key_results",
    withUser(
      GOALS.flatMap((g) =>
        g.krs.map((kr, i) => ({
          external_id: kr.external_id,
          goal_id: goals.get(g.external_id)!,
          title: kr.title,
          target_value: kr.target_value,
          unit: kr.unit ?? null,
          position: i,
        })),
      ),
    ),
  );

  await insertMissing(
    supabase,
    "milestones",
    withUser(
      MILESTONES.map((m) => ({
        external_id: m.external_id,
        track_id: tracks.get(m.track) ?? null,
        goal_id: "goal" in m && m.goal ? goals.get(m.goal) ?? null : null,
        title: m.title,
        notes: "notes" in m ? m.notes : null,
        due_date: m.due_date,
      })),
    ),
  );

  await insertMissing(
    supabase,
    "targets",
    withUser(TARGETS.map(({ track, ...t }) => ({ ...t, track_id: tracks.get(track) ?? null }))),
  );

  await insertMissing(
    supabase,
    "tasks",
    withUser(
      TASKS.map((t, i) => ({
        external_id: t.external_id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        position: i,
        goal_id: goals.get(t.goal) ?? null,
      })),
    ),
  );

  await insertMissing(supabase, "habits", withUser([...HABITS]));

  const positions = new Map<string, number>();
  await insertMissing(
    supabase,
    "roadmap_nodes",
    withUser(
      ROADMAP_NODES.map((n) => {
        const pos = positions.get(n.roadmap) ?? 0;
        positions.set(n.roadmap, pos + 1);
        return {
          external_id: n.id,
          roadmap: n.roadmap,
          parent_external_id: n.parent ?? null,
          kind: n.kind,
          title: n.title,
          description: n.description ?? null,
          position: pos,
          side: n.side ?? null,
          status: n.status ?? null,
          link_type: n.link?.type ?? "none",
          link_ref: n.link?.ref ?? null,
          requires: n.requires ?? [],
          resources: n.resources ?? [],
          app_href: n.href ?? null,
        };
      }),
    ),
  );
  await insertMissing(supabase, "funds", withUser([...FUNDS]));
  await insertMissing(
    supabase,
    "planned_costs",
    withUser(PLANNED_COSTS.map(({ track, ...c }) => ({ ...c, track_id: tracks.get(track) ?? null }))),
  );
}

/** Roda o seed uma vez por versão de conteúdo. Chamado pelo layout autenticado. */
export async function ensureContent(supabase: Client, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("content_version").eq("id", userId).maybeSingle();
  if (profile && profile.content_version >= CONTENT_VERSION) return;

  await seedContent(supabase, userId);
  await supabase
    .from("profiles")
    .upsert({ id: userId, content_version: CONTENT_VERSION }, { onConflict: "id" });
}

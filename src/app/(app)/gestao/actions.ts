"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { localDate } from "@/lib/dates";

export type FormState = { error?: string; ok?: boolean; message?: string };

const STATUS = z.enum(["backlog", "todo", "doing", "done"]);

function refresh() {
  revalidatePath("/gestao", "layout");
  revalidatePath("/dashboard");
}

const taskSchema = z.object({
  title: z.string().trim().min(2, "Descreva a tarefa.").max(300),
  status: STATUS.default("todo"),
  priority: z.coerce.number().int().min(1).max(3).default(2),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).transform((v) => v || null).optional(),
  goal_id: z.uuid().or(z.literal("")).transform((v) => v || null).optional(),
});

export async function createTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // Nova tarefa entra no topo da coluna
  const { data: first } = await supabase
    .from("tasks")
    .select("position")
    .eq("status", parsed.data.status)
    .order("position")
    .limit(1)
    .maybeSingle();
  const position = (first?.position ?? 1) - 1;
  const { error } = await supabase.from("tasks").insert({ ...parsed.data, position });
  if (error) return { error: "Não foi possível criar a tarefa." };
  refresh();
  return { ok: true, message: "Tarefa criada." };
}

const moveSchema = z.object({ id: z.uuid(), status: STATUS, position: z.number() });

export async function moveTask(input: z.infer<typeof moveSchema>) {
  const { id, status, position } = moveSchema.parse(input);
  const { supabase } = await requireUser();
  await supabase
    .from("tasks")
    .update({ status, position, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id);
  refresh();
}

export async function deleteTask(input: { id: string }) {
  const { supabase } = await requireUser();
  await supabase.from("tasks").delete().eq("id", z.uuid().parse(input.id));
  refresh();
}

// Hábitos
export async function toggleHabit(input: { habitId: string; date: string }) {
  const habitId = z.uuid().parse(input.habitId);
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(input.date);
  if (date > localDate()) throw new Error("Não dá para marcar dias futuros.");
  const { supabase } = await requireUser();
  const { data: existing } = await supabase.from("habit_logs").select("id").eq("habit_id", habitId).eq("date", date).maybeSingle();
  if (existing) await supabase.from("habit_logs").delete().eq("id", existing.id);
  else await supabase.from("habit_logs").insert({ habit_id: habitId, date });
  refresh();
  return { done: !existing };
}

const habitSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao hábito.").max(100),
  cue: z.string().trim().max(200).optional(),
  target_per_week: z.coerce.number().int().min(1).max(7),
});

export async function createHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = habitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("habits").insert({ ...parsed.data, position: 99 });
  if (error) return { error: "Não foi possível criar o hábito." };
  refresh();
  return { ok: true, message: "Hábito criado." };
}

export async function archiveHabit(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("habits").update({ archived: true }).eq("id", z.uuid().parse(formData.get("id")));
  refresh();
}

// Pomodoro
const pomodoroSchema = z.object({
  subjectId: z.uuid().nullable(),
  label: z.string().trim().max(200).nullable(),
  durationMin: z.number().int().min(1).max(180),
});

export async function logPomodoro(input: z.infer<typeof pomodoroSchema>) {
  const { subjectId, label, durationMin } = pomodoroSchema.parse(input);
  const { supabase } = await requireUser();
  const startedAt = new Date(Date.now() - durationMin * 60_000).toISOString();
  await supabase.from("pomodoro_sessions").insert({ subject_id: subjectId, label, duration_min: durationMin, started_at: startedAt });
  refresh();
}

// Revisão semanal
const reviewSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wins: z.string().trim().max(4000).optional(),
  lessons: z.string().trim().max(4000).optional(),
  blockers: z.string().trim().max(4000).optional(),
  next_focus: z.string().trim().max(4000).optional(),
  energy: z.coerce.number().int().min(1).max(5).optional(),
});

export async function saveWeeklyReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os campos." };
  const { error } = await supabase
    .from("weekly_reviews")
    .upsert({ ...parsed.data, user_id: userId }, { onConflict: "user_id,week_start" });
  if (error) return { error: "Não foi possível salvar a revisão." };
  refresh();
  return { ok: true, message: "Revisão salva." };
}

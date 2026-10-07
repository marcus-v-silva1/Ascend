"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(""))
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

function refresh() {
  revalidatePath("/carreira", "layout");
  revalidatePath("/dashboard");
}

const goalSchema = z.object({
  track_id: z.uuid().or(z.literal("")).transform((v) => v || null),
  title: z.string().trim().min(3, "Dê um título à meta.").max(200),
  description: optionalText(2000),
  implementation_intention: optionalText(500),
  target_date: optionalDate,
});

export async function createGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("goals").insert(parsed.data);
  if (error) return { error: "Não foi possível criar a meta." };
  refresh();
  return { ok: true };
}

export async function setGoalStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["active", "done", "paused", "dropped"]).parse(formData.get("status"));
  await supabase.from("goals").update({ status }).eq("id", id);
  refresh();
}

export async function updateIntention(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const value = z.string().trim().max(500).parse(formData.get("implementation_intention") ?? "");
  await supabase.from("goals").update({ implementation_intention: value || null }).eq("id", id);
  refresh();
}

const krSchema = z.object({
  goal_id: z.uuid(),
  title: z.string().trim().min(2).max(200),
  target_value: z.coerce.number().positive(),
  unit: optionalText(40),
});

export async function createKeyResult(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = krSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Preencha título e alvo do resultado-chave." };
  const { error } = await supabase.from("key_results").insert(parsed.data);
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true };
}

export async function setKeyResultValue(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const value = z.coerce.number().min(0).parse(formData.get("current_value"));
  await supabase.from("key_results").update({ current_value: value }).eq("id", id);
  refresh();
}

export async function bumpKeyResult(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const delta = z.coerce.number().parse(formData.get("delta"));
  const { data: kr } = await supabase.from("key_results").select("current_value, target_value").eq("id", id).single();
  if (!kr) return;
  const next = Math.max(0, Number(kr.current_value) + delta);
  await supabase.from("key_results").update({ current_value: next }).eq("id", id);
  refresh();
}

const milestoneSchema = z.object({
  track_id: z.uuid().or(z.literal("")).transform((v) => v || null),
  goal_id: z.uuid().or(z.literal("")).transform((v) => v || null).optional(),
  title: z.string().trim().min(3, "Descreva o marco.").max(200),
  due_date: optionalDate,
  notes: optionalText(1000),
});

export async function createMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("milestones").insert(parsed.data);
  if (error) return { error: "Não foi possível salvar o marco." };
  refresh();
  return { ok: true };
}

export async function toggleMilestone(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const done = formData.get("done") === "true";
  await supabase.from("milestones").update({ done_at: done ? null : new Date().toISOString() }).eq("id", id);
  refresh();
}

export async function deleteMilestone(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("milestones").delete().eq("id", z.uuid().parse(formData.get("id")));
  refresh();
}

// Alvos (concursos, países)
const score = z.coerce.number().min(0).max(10).or(z.literal("").transform(() => null));
const targetSchema = z.object({
  id: z.uuid().optional(),
  track_id: z.uuid().or(z.literal("")).transform((v) => v || null).optional(),
  kind: z.enum(["concurso", "country", "company", "certification"]),
  name: z.string().trim().min(2).max(200),
  location: optionalText(200),
  salary_text: optionalText(200),
  compatibility: score,
  difficulty: score,
  salary_score: score,
  location_score: score,
  status: z.string().trim().min(1).max(60),
  exam_date: optionalDate,
  url: z.url().or(z.literal("")).transform((v) => v || null).optional(),
  notes: optionalText(2000),
});

export async function saveTarget(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = targetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const { id, ...row } = parsed.data;
  const { error } = id
    ? await supabase.from("targets").update(row).eq("id", id)
    : await supabase.from("targets").insert(row);
  if (error) return { error: "Não foi possível salvar o alvo." };
  refresh();
  return { ok: true };
}

export async function deleteTarget(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("targets").delete().eq("id", z.uuid().parse(formData.get("id")));
  refresh();
}

// Candidaturas
const appSchema = z.object({
  company: z.string().trim().min(1, "Informe a empresa.").max(200),
  role: z.string().trim().min(1, "Informe a vaga.").max(200),
  country: optionalText(80),
  city: optionalText(80),
  url: z.url().or(z.literal("")).transform((v) => v || null).optional(),
  status: z.enum(["wishlist", "applied", "screening", "interview", "offer", "rejected", "withdrawn"]),
  applied_at: optionalDate,
  next_step: optionalText(300),
  next_step_at: optionalDate,
  salary: optionalText(100),
  visa_route: optionalText(100),
  notes: optionalText(4000),
});

export async function createApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = appSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const row = { ...parsed.data };
  if (row.status === "applied" && !row.applied_at) row.applied_at = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("applications").insert(row);
  if (error) return { error: "Não foi possível salvar a candidatura." };
  await syncApplicationKRs();
  refresh();
  return { ok: true };
}

export async function setApplicationStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const status = appSchema.shape.status.parse(formData.get("status"));
  const patch: { status: typeof status; applied_at?: string } = { status };
  if (status === "applied") {
    const { data } = await supabase.from("applications").select("applied_at").eq("id", id).single();
    if (!data?.applied_at) patch.applied_at = new Date().toISOString().slice(0, 10);
  }
  await supabase.from("applications").update(patch).eq("id", id);
  await syncApplicationKRs();
  refresh();
}

export async function deleteApplication(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("applications").delete().eq("id", z.uuid().parse(formData.get("id")));
  await syncApplicationKRs();
  refresh();
}

/** Mantém os KRs "candidaturas enviadas" e "entrevistas" em dia com o pipeline. */
async function syncApplicationKRs() {
  const { supabase } = await requireUser();
  const { data: apps } = await supabase.from("applications").select("status");
  const list = apps ?? [];
  const sent = list.filter((a: { status: string }) => a.status !== "wishlist").length;
  const interviews = list.filter((a: { status: string }) => ["interview", "offer"].includes(a.status)).length;
  const offers = list.filter((a: { status: string }) => a.status === "offer").length;
  await Promise.all([
    supabase.from("key_results").update({ current_value: sent }).eq("external_id", "kr-eu-apps"),
    supabase.from("key_results").update({ current_value: interviews }).eq("external_id", "kr-eu-interviews"),
    supabase.from("key_results").update({ current_value: Math.min(offers, 1) }).eq("external_id", "kr-eu-offer"),
  ]);
}

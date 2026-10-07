"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean; message?: string };

const money = z.coerce.number().finite();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optDate = date.or(z.literal("")).transform((v) => v || null).optional();
const currency = z.enum(["BRL", "USD", "EUR"]);

function refresh() {
  revalidatePath("/financas");
  revalidatePath("/dashboard");
}

export async function addFundEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({ fund_id: z.uuid(), amount: money.refine((v) => v !== 0, "Informe um valor."), date, note: z.string().trim().max(200).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("fund_entries").insert(parsed.data);
  if (error) return { error: "Não foi possível registrar." };
  refresh();
  return { ok: true, message: parsed.data.amount > 0 ? "Aporte registrado." : "Retirada registrada." };
}

export async function createFund(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2).max(100), target_amount: money.positive(), currency, target_date: optDate })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Preencha nome e valor da meta." };
  const { error } = await supabase.from("funds").insert(parsed.data);
  if (error) return { error: "Não foi possível criar a reserva." };
  refresh();
  return { ok: true, message: "Reserva criada." };
}

export async function createDebt(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Dê um nome à dívida.").max(100),
      creditor: z.string().trim().max(100).optional(),
      original_amount: money.positive("Informe o saldo devedor."),
      interest_rate_month: money.min(0).default(0),
      min_payment: money.min(0).default(0),
      due_day: z.coerce.number().int().min(1).max(31).or(z.literal("").transform(() => null)).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("debts").insert(parsed.data);
  if (error) return { error: "Não foi possível salvar a dívida." };
  refresh();
  return { ok: true, message: "Dívida cadastrada." };
}

export async function payDebt(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z.object({ debt_id: z.uuid(), amount: money.positive("Informe o valor pago."), date }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("debt_payments").insert(parsed.data);
  if (error) return { error: "Não foi possível registrar o pagamento." };

  // Marca como quitada quando os pagamentos cobrem o saldo original
  const [{ data: debt }, { data: payments }] = await Promise.all([
    supabase.from("debts").select("original_amount").eq("id", parsed.data.debt_id).single(),
    supabase.from("debt_payments").select("amount").eq("debt_id", parsed.data.debt_id),
  ]);
  const paid = (payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
  if (debt && paid >= Number(debt.original_amount)) {
    await supabase.from("debts").update({ paid_off_at: parsed.data.date }).eq("id", parsed.data.debt_id);
  }
  refresh();
  return { ok: true, message: "Pagamento registrado." };
}

export async function createPlannedCost(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Descreva o custo.").max(200),
      category: z.string().trim().max(60).optional(),
      amount: money.positive("Informe o valor."),
      currency,
      due_date: optDate,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("planned_costs").insert(parsed.data);
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true, message: "Custo adicionado." };
}

export async function togglePaidCost(formData: FormData) {
  const { supabase } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  const paid = formData.get("paid") === "true";
  await supabase.from("planned_costs").update({ paid_at: paid ? null : new Date().toISOString().slice(0, 10) }).eq("id", id);
  refresh();
}

export async function deletePlannedCost(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("planned_costs").delete().eq("id", z.uuid().parse(formData.get("id")));
  refresh();
}

export async function saveRates(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const parsed = z.object({ usd_brl: money.positive(), eur_brl: money.positive() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Cotações inválidas." };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true, message: "Cotações atualizadas." };
}

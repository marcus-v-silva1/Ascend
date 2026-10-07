"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean; message?: string };

const schema = z.object({
  display_name: z.string().trim().min(1, "Informe como quer ser chamado.").max(60),
  target_cefr: z.enum(["A2", "B1", "B2", "C1", "C2"]),
  target_cefr_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).transform((v) => v || null),
  daily_new_cards: z.coerce.number().int().min(0).max(200),
});

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: "Não foi possível salvar o perfil." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil salvo." };
}

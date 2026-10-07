"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isOwner } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sent?: boolean };

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().optional(),
  next: z.string().optional(),
});

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, next } = parsed.data;

  // Mesma mensagem para e-mail desconhecido e senha errada: não revela quem é o dono.
  if (!isOwner(email)) return { error: "E-mail ou senha incorretos." };

  const supabase = await createClient();

  if (password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "E-mail ou senha incorretos." };
    redirect(safeNext(next));
  }

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: "Não foi possível enviar o link. Tente de novo em instantes." };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

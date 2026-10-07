// Variáveis públicas são inlinadas no bundle do cliente; as privadas só existem no servidor.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** E-mail do único usuário autorizado. Vazio = qualquer usuário autenticado (apenas dev). */
export function ownerEmail(): string {
  return (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
}

export function isOwner(email: string | null | undefined): boolean {
  const owner = ownerEmail();
  if (!owner) return process.env.NODE_ENV !== "production";
  return (email ?? "").trim().toLowerCase() === owner;
}

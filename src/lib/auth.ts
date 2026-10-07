import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isOwner } from "@/lib/env";
import { ensureContent } from "@/lib/content/bootstrap";
import { createClient } from "@/lib/supabase/server";

/** Garante que quem chama é o dono. Use em toda página e server action protegida. */
export const requireUser = cache(async () => {
  // Páginas autenticadas dependem de cookies e do relógio: sempre renderizadas por requisição
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || !isOwner(claims.email as string | undefined)) redirect("/login");
  const userId = claims.sub as string;
  // Layout e página renderizam em paralelo: o seed roda aqui para que nenhuma
  // página leia o banco antes do conteúdo inicial existir. cache() garante 1x por requisição.
  await ensureContent(supabase, userId);
  return { supabase, userId, email: claims.email as string };
});

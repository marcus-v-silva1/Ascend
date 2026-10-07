import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isOwner } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Garante que quem chama é o dono. Use em toda página e server action protegida. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || !isOwner(claims.email as string | undefined)) redirect("/login");
  return { supabase, userId: claims.sub as string, email: claims.email as string };
});

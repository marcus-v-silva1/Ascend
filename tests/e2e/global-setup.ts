import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdir } from "node:fs/promises";

/**
 * Cria (se preciso) o usuário dono de teste e salva a sessão logada.
 * Precisa de: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL, E2E_PASSWORD.
 * Use apenas contra um Supabase local ou de teste, nunca o de produção.
 */
export default async function globalSetup(config: FullConfig) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.OWNER_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!url || !serviceKey || !email || !password) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL e E2E_PASSWORD para os testes E2E.");
  }
  if (!/127\.0\.0\.1|localhost/.test(url) && !process.env.E2E_ALLOW_REMOTE) {
    throw new Error("Por segurança, os E2E só rodam contra Supabase local. Defina E2E_ALLOW_REMOTE=1 para um projeto de teste.");
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error && !/already/i.test(error.message)) throw error;

  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  // Primeiro acesso roda o seed do conteúdo; pode levar alguns segundos
  await page.waitForURL("**/dashboard", { timeout: 60_000 });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await mkdir("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: "playwright/.auth/owner.json" });
  await browser.close();
}

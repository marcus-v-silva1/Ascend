import { expect, test } from "@playwright/test";

test("visitante é levado ao login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page.getByRole("heading", { name: "Glow-Up" })).toBeVisible();
});

test("e-mail que não é do dono não entra", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("intruso@exemplo.test");
  await page.getByLabel("Senha").fill("qualquer-coisa-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
  await expect(page).toHaveURL(/\/login/);
});

test("senha errada do dono não entra", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.OWNER_EMAIL!);
  await page.getByLabel("Senha").fill("senha-errada-000");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
});

test("rota de exportação exige login", async ({ request }) => {
  const res = await request.get("/flashcards/exportar", { maxRedirects: 0 });
  expect([302, 307, 401]).toContain(res.status());
});

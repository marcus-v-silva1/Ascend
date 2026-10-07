import { expect, test } from "@playwright/test";

test("tarefas: cria e aparece em 'Esta semana'", async ({ page }) => {
  const title = `Tarefa e2e ${Date.now()}`;
  await page.goto("/gestao");
  await page.getByText("Nova tarefa").click();
  await page.getByLabel("Tarefa").fill(title);
  await page.getByRole("button", { name: "Adicionar" }).click();
  const column = page.getByRole("region", { name: /Esta semana/ });
  await expect(column.getByText(title)).toBeVisible();
});

test("hábitos: marca e desmarca o dia no dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  const habit = page.getByRole("region", { name: "Hábitos de hoje" }).getByRole("button").first();
  const was = await habit.getAttribute("aria-pressed");
  await habit.click();
  await expect(habit).toHaveAttribute("aria-pressed", was === "true" ? "false" : "true");
  await habit.click();
  await expect(habit).toHaveAttribute("aria-pressed", was ?? "false");
});

test("carreira: resultado-chave sobe com +", async ({ page }) => {
  await page.goto("/carreira");
  const plus = page.getByRole("button", { name: /Aumentar Ler o Scrum Guide/ });
  const counter = plus.locator("xpath=../preceding-sibling::span");
  const before = await counter.textContent();
  await plus.click();
  await expect(counter).not.toHaveText(before!);
  await page.getByRole("button", { name: /Diminuir Ler o Scrum Guide/ }).click();
  await expect(counter).toHaveText(before!);
});

test("alvos: Dataprev aparece no ranking", async ({ page }) => {
  await page.goto("/carreira/alvos");
  await expect(page.getByText("Dataprev: Analista de TI")).toBeVisible();
});

test("inglês: registra prática e soma minutos", async ({ page }) => {
  await page.goto("/ingles");
  await page.getByLabel("Minutos").fill("5");
  await page.getByLabel("O que fez").fill("e2e listening");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  await expect(page.getByText("5 min registrados.")).toBeVisible();
});

test("finanças: aporte atualiza a reserva", async ({ page }) => {
  await page.goto("/financas");
  const fund = page.getByRole("article").filter({ hasText: "Reserva de emergência" });
  await fund.getByText("Registrar aporte ou retirada").click();
  await fund.getByLabel(/Valor/).fill("100");
  await fund.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Aporte registrado.")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.describe("questões", () => {
  test("prática: responde, vê a correção e chega ao resultado", async ({ page }) => {
    await page.goto("/estudos");
    const psm = page.getByRole("region", { name: "PSM I (Scrum)" });
    await expect(psm).toBeVisible();
    await psm.getByLabel("Quantidade").fill("3");
    await psm.getByLabel("Quais questões").selectOption("all");
    await psm.getByRole("button", { name: "Começar prática" }).click();
    await page.waitForURL(/\/estudos\/sessao\//);

    for (let i = 0; i < 3; i++) {
      await expect(page.getByText(`${i + 1} de 3`)).toBeVisible();
      // Marca a primeira alternativa; em questão "Escolha N", marca N
      const tag = page.getByText(/^Escolha \d$/);
      const n = (await tag.count()) ? Number((await tag.textContent())!.match(/\d/)![0]) : 1;
      const options = page.getByRole("radio").or(page.getByRole("checkbox"));
      for (let k = 0; k < n; k++) await options.nth(k).click();
      await page.getByRole("button", { name: "Responder" }).click();
      await expect(page.getByRole("status").filter({ hasText: /Correto|Incorreto/ })).toBeVisible();
      if (i < 2) await page.getByRole("button", { name: "Próxima" }).click();
    }

    await page.getByRole("button", { name: "Ver resultado" }).click();
    await page.waitForURL(/\/resultado$/);
    await expect(page.getByRole("heading", { name: "Por assunto" })).toBeVisible();
    await expect(page.getByText(/de 3 certas/)).toBeVisible();
  });

  test("simulado: gabarito só aparece no fim", async ({ page }) => {
    await page.goto("/estudos");
    const psm = page.getByRole("region", { name: "PSM I (Scrum)" });
    await psm.getByRole("radio", { name: "Simulado" }).click();
    await psm.getByLabel("Simulado").selectOption({ label: "Mini PSM (20 questões)" });
    await psm.getByRole("button", { name: "Começar simulado" }).click();
    await page.waitForURL(/\/estudos\/sessao\//);

    await expect(page.getByText(/\d+:\d{2}/).first()).toBeVisible(); // relógio
    await page.getByRole("radio").or(page.getByRole("checkbox")).first().click();
    await expect(page.getByText(/^(Correto|Incorreto)$/)).toHaveCount(0);

    await page.getByRole("button", { name: "Encerrar" }).click();
    await page.waitForURL(/\/resultado$/);
    await expect(page.getByText(/Abaixo do corte|Aprovado/)).toBeVisible();
    // Não respondidas viram erro e vão para revisão
    await expect(page.getByRole("heading", { name: "Revise o que errou" })).toBeVisible();
  });
});

test("flashcards: revisa um cartão", async ({ page }) => {
  await page.goto("/flashcards/revisar");
  await page.getByRole("button", { name: "Mostrar resposta" }).click();
  const before = await page.getByText(/feitos ·/).textContent();
  await page.getByRole("button", { name: /^Bom/ }).click();
  await expect(page.getByText(/feitos ·/)).not.toHaveText(before!);
});

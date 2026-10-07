import { expect, test } from "@playwright/test";

test("celular: navegação inferior e sem rolagem horizontal", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Atalhos" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Flashcards" }).click();
  await expect(page).toHaveURL(/\/flashcards/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

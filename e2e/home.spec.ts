import { expect, test } from "@playwright/test";

test("landing page explains the product", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Understand the law");
  await expect(page.getByRole("link", { name: /Try the Kikuubo trader demo/ })).toBeVisible();
});

test("demo trader asks a scenario question and gets a sourced answer", async ({ page }) => {
  await page.goto("/ask?demo=1");
  await page.getByRole("button", { name: /My trading licence is expiring/ }).click();

  const card = page.getByTestId("answer-card");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.getByRole("heading", { name: "Sources" })).toBeVisible();

  await card.getByRole("tab", { name: /Original law/ }).click();
  await expect(card.locator("blockquote").first()).toBeVisible();
});

test("out-of-scope questions are refused, not guessed", async ({ page }) => {
  await page.goto("/ask?demo=1");
  await page.getByLabel("Your question").fill("How do I file for divorce?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByText("Not covered by our sources")).toBeVisible({ timeout: 20_000 });
});

test("onboarding saves the profile and opens the ask page", async ({ page }) => {
  await page.goto("/onboard");
  await page.getByLabel("Where is it located?").fill("Owino Market, Kampala");
  await page.getByRole("button", { name: /Save and ask a question/ }).click();
  await expect(page).toHaveURL(/\/ask$/);
  await expect(page.getByText("Owino Market, Kampala")).toBeVisible();
});

test("sources page lists every document with its currency", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.getByRole("heading", { name: "Trade (Licensing) Act" })).toBeVisible();
  await expect(page.getByText("Older text, may be outdated").first()).toBeVisible();
});

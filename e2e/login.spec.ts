import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

test("signing in with any test email continues to the business profile", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(en["auth.demoNote"])).toBeVisible();
  await page.getByLabel(en["auth.email"]).fill("test@manya.ug");
  await page.getByLabel(en["auth.password"]).fill("anything");
  await page.getByRole("button", { name: en["auth.submitSignIn"], exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test("signing up continues to the business profile", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("tab", { name: en["auth.signUp"] }).click();
  await page.getByLabel(en["auth.email"]).fill("new.trader@example.com");
  await page.getByLabel(en["auth.password"]).fill("secret");
  await page.getByRole("button", { name: en["auth.submitSignUp"] }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test("a malformed email or empty password is caught before continuing", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(en["auth.email"]).fill("not-an-email");
  await page.getByRole("button", { name: en["auth.submitSignIn"], exact: true }).click();
  await expect(page.getByText(en["auth.emailError"])).toBeVisible();
  await expect(page.getByText(en["auth.passwordError"])).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("the hackathon demo opens the dashboard, ready to start the live demo", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: en["auth.hackathon"] }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome, Sarah");

  await page.getByRole("button", { name: en["demo.live"] }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/, { timeout: 30_000 });
  await expect(page.getByTestId("demo-suggestion")).toBeVisible();
});

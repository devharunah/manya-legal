import { type Page, expect } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

/** Registers a fresh trader (each test has its own browser context, so its own session). */
export async function register(page: Page, { language = "English" } = {}) {
  await page.goto("/register");
  await page.getByLabel(en["register.fullName"]).fill("Nakato Sarah");
  await page.getByLabel(en["register.phone"]).fill("0772 123456");
  await page.getByLabel(en["register.businessName"]).fill("Nakato General Store");
  await page.getByLabel(language).check();
  await page.getByRole("button", { name: en["register.save"] }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Starts a dispute from the dashboard and returns its id. */
export async function startCase(page: Page): Promise<string> {
  await page.getByRole("button", { name: en["dashboard.newButton"] }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/);
  return page.url().split("/").at(-1) as string;
}

export async function say(page: Page, text: string) {
  await page.getByLabel(en["intake.label"]).fill(text);
  await page.getByRole("button", { name: en["intake.send"] }).click();
}

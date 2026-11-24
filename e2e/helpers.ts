import { type Page, expect } from "@playwright/test";

import type { MessageKey } from "../src/lib/i18n/en";
import { translate } from "../src/lib/i18n/translate";

/** The label a trader sees in the given language. */
export const label = (lang: "en" | "lug", key: MessageKey) => translate(lang, key);

/** Registers a fresh trader (each test has its own browser context, so its own session). */
export async function register(page: Page, { language = "English" } = {}) {
  await page.goto("/register");
  await page.getByLabel(label("en", "register.fullName")).fill("Nakato Sarah");
  await page.getByLabel(label("en", "register.phone")).fill("0772 123456");
  await page.getByLabel(label("en", "register.businessName")).fill("Nakato General Store");
  await page.getByLabel(language).check();
  await page.getByRole("button", { name: label("en", "register.save") }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Starts a dispute from the dashboard and returns its id. */
export async function startCase(page: Page, lang: "en" | "lug" = "en"): Promise<string> {
  await page.getByRole("button", { name: label(lang, "dashboard.newButton") }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/);
  return page.url().split("/").at(-1) as string;
}

export async function say(page: Page, text: string, lang: "en" | "lug" = "en") {
  await page.getByLabel(label(lang, "intake.label")).fill(text);
  await page.getByRole("button", { name: label(lang, "intake.send") }).click();
}

import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

import { register } from "./helpers";

test("landing page explains the product and starts at sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(en["landing.title"]);
  await page.getByRole("link", { name: en["landing.start"] }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("pages that need a profile send a new visitor to sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("registration opens the dashboard with the main navigation", async ({ page }) => {
  await register(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome, Nakato");
  const nav = page.getByRole("navigation", { name: en["nav.menu"] }).first();
  for (const key of [
    "nav.dashboard",
    "nav.cases",
    "nav.vault",
    "nav.support",
    "nav.profile",
  ] as const) {
    await expect(nav.getByRole("link", { name: en[key] })).toBeAttached();
  }
});

test("choosing Luganda at registration switches the page language", async ({ page }) => {
  await register(page, { language: "Oluganda" });
  await expect(page.locator("html")).toHaveAttribute("lang", "lg");
  await page.reload();
  await expect(page.getByRole("button", { name: "Oluganda" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

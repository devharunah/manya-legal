import { type Page, expect, test } from "@playwright/test";

const phone = (page: Page) => page.getByRole("region", { name: "Simulated phone" });

async function dialOnKeypad(page: Page, code: string) {
  for (const key of code) await phone(page).getByRole("button", { name: key, exact: true }).click();
  await expect(page.getByTestId("dialed")).toHaveText(code);
  await phone(page).getByRole("button", { name: "Call" }).click();
}

async function reply(page: Page, text: string, expected: string | RegExp) {
  await page.getByLabel("Reply").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("ussd-text")).toContainText(expected);
}

test("a trader reports a dispute by USSD and gets an SMS with the reference", async ({ page }) => {
  await page.goto("/emulator");
  await dialOnKeypad(page, "*245#");
  await expect(page.getByTestId("ussd-text")).toContainText("1. Report a dispute");

  await reply(page, "1", "Supplier's name");
  await reply(page, "Okello Traders", "What did you buy?");
  await reply(page, "50 bags of sugar", "How much did you pay?");
  await reply(page, "lots", "Invalid choice.");
  await reply(page, "2500000", "How did you pay?");
  await reply(page, "1", "What happened?");
  await reply(page, "1", "How did you agree?");
  await reply(page, "3", "What do you want?");
  await reply(page, "1", "UGX 2,500,000");
  await reply(page, "1", "Case MNY-0042 saved");

  await expect(page.getByRole("status", { name: "SMS" })).toContainText("MNY-0042");
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("dialog", { name: "USSD" })).toHaveCount(0);

  // The new case is listed under My cases until the page is reloaded.
  await page.getByRole("button", { name: "*245*2# My cases" }).click();
  await phone(page).getByRole("button", { name: "Call" }).click();
  await expect(page.getByTestId("ussd-text")).toContainText("MNY-0042 Okello Traders");
});

test("shortcut codes open legal options and help, with sources and real contacts", async ({
  page,
}) => {
  await page.goto("/emulator");
  await dialOnKeypad(page, "*245*3*4#");
  await expect(page.getByTestId("ussd-text")).toContainText("UGX 10,000,000");
  await expect(page.getByTestId("ussd-text")).toContainText("Src: Small Claims Procedure Rules");
  await reply(page, "00", "Welcome to MANYA");
  await reply(page, "4", "Get legal help");
  await reply(page, "1", "0800 100 212");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog", { name: "USSD" })).toHaveCount(0);
});

test("the menu switches to Luganda, and other codes are not answered", async ({ page }) => {
  await page.goto("/emulator");
  await dialOnKeypad(page, "*245*5*2#");
  await expect(page.getByTestId("ussd-text")).toContainText("Emisango gyange");
  await page.getByRole("button", { name: "Cancel" }).click();

  await dialOnKeypad(page, "*123#");
  await expect(page.getByTestId("ussd-text")).toHaveText("Connection problem or invalid MMI code.");
});

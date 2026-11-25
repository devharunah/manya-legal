import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

test("the live demo runs the chat to a report with one tap per question", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: en["demo.live"] }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/, { timeout: 30_000 });

  // Opening account, then the agreement, parties, events and outcome questions.
  const chip = page.getByTestId("demo-suggestion");
  const generate = page.getByRole("button", { name: en["review.generate"] });
  for (let i = 0; i < 6 && !(await generate.isVisible()); i++) {
    const before = await page.getByTestId("trader-message").count();
    await chip.click();
    await expect(page.getByLabel(en["intake.label"])).not.toHaveValue("");
    await page.getByRole("button", { name: en["intake.send"] }).click();
    await expect(page.getByTestId("trader-message")).toHaveCount(before + 1, { timeout: 20_000 });
    await expect(page.getByText(en["intake.thinking"])).toHaveCount(0, { timeout: 20_000 });
  }

  await expect(page.getByText(en["intake.done"])).toBeVisible();
  await expect(chip).toHaveCount(0);
  for (const unwanted of [en["intake.retry"], en["intake.otherCategory"]])
    await expect(page.getByText(unwanted)).toHaveCount(0);

  await page.getByLabel(en["review.confirm"]).check();
  await generate.click();
  await expect(page.getByText(en["review.generated"])).toBeVisible({ timeout: 30_000 });

  // Organise: the presenter uploads the SAMPLE files live.
  await page.getByRole("tab", { name: en["case.tabOrganise"] }).click();
  const files = [
    "SAMPLE_mobile_money_payment_confirmation.pdf",
    "SAMPLE_commercial_invoice.pdf",
    "SAMPLE_whatsapp_supplier_conversation.png",
    "SAMPLE_trader_statement.pdf",
  ];
  for (const [i, file] of files.entries()) {
    await page.locator('input[type="file"]').setInputFiles(`public/demo/${file}`);
    await expect(page.getByTestId("evidence-card")).toHaveCount(i + 1, { timeout: 20_000 });
  }

  // Resolve: options with the preliminary notice; no arbitration (none was reported).
  await page.getByRole("tab", { name: en["case.tabResolve"] }).click();
  await expect(page.getByTestId("resolve-disclaimer")).toHaveText(en["resolve.disclaimer"]);
  await expect(page.getByTestId("pathway-small_claims")).toContainText("UGX 2,000,000");
  await expect(page.getByTestId("pathway-arbitration")).toHaveCount(0);

  // A live case doesn't stop the prepared demo case from loading.
  await page.goto("/");
  await page.getByRole("button", { name: en["demo.open"] }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: en["review.download"].replace("{n}", "1") }),
  ).toBeVisible();
});

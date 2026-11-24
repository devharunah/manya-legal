import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

test("the stage demo opens a complete case with evidence, a report and options", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: en["demo.open"] }).click();
  await expect(page).toHaveURL(/\/cases\/[\w-]+$/, { timeout: 30_000 });

  // Report: the conversation, a confirmed report and its PDF.
  await expect(page.getByTestId("trader-message").first()).toContainText("Kato Wholesalers");
  await expect(
    page.getByRole("link", { name: en["review.download"].replace("{n}", "1") }),
  ).toBeVisible();

  // Organise: three SAMPLE documents, all consistent.
  await page.getByRole("tab", { name: en["case.tabOrganise"] }).click();
  await expect(page.getByTestId("evidence-card")).toHaveCount(3);
  await expect(page.getByTestId("consistency-flag")).toHaveCount(0);

  // Resolve: options are ready straight away.
  await page.getByRole("tab", { name: en["case.tabResolve"] }).click();
  await expect(page.getByTestId("pathway-small_claims")).toContainText("UGX 2,000,000");

  // The second demo case shows the PRD inconsistency.
  await page.goto("/cases");
  await expect(page.getByTestId("case-row")).toHaveCount(2);
  await page.getByTestId("case-row").filter({ hasText: "Ssemanda Brian" }).click();
  await page.getByRole("tab", { name: en["case.tabOrganise"] }).click();
  await expect(page.getByTestId("consistency-flag")).toContainText("1,500,000");
});

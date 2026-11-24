import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";
import { MOCK_ENGLISH, MOCK_TRANSCRIPT } from "../src/lib/voice/mock";

import { register, say, startCase } from "./helpers";

// The recorder needs a real (fake-device) microphone, which the headless shell lacks.
test.use({
  channel: "chromium",
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  permissions: ["microphone"],
});

test("PRD 13 test 1: report a non-delivery, confirm it and get the PDF", async ({ page }) => {
  await register(page);
  const caseId = await startCase(page);

  await say(
    page,
    "I paid the supplier 2,000,000 shillings on 10 November 2026 for merchandise, but the goods have not been delivered.",
  );
  await expect(page.getByText(en["intake.understood"])).toBeVisible();
  // Name and phone came from registration, so the first question is about the supplier.
  await expect(page.getByTestId("manya-message").last()).toHaveText(en["q.respondent.name"]);

  await say(page, "Kato Wholesalers");
  await expect(page.getByTestId("manya-message").last()).toHaveText(en["q.transaction.goods"]);
  await page.getByRole("button", { name: en["intake.skip"] }).click();
  await expect(page.getByTestId("manya-message").last()).toHaveText(
    en["q.transaction.agreement_type"],
  );
  await say(page, "We agreed on WhatsApp");
  await expect(page.getByTestId("manya-message").last()).toHaveText(en["q.requested_resolution"]);
  await say(page, "I want my money back, a refund");

  await page.getByRole("button", { name: en["intake.reviewNow"] }).click();
  const fields = page.getByTestId("report-fields");
  await expect(fields.locator('[data-field="transaction.amount"]')).toContainText("2,000,000");
  await expect(fields.locator('[data-field="respondent.name"]')).toContainText("Kato Wholesalers");
  await expect(fields.locator('[data-field="transaction.goods"]')).toContainText(
    en["review.unknown"],
  );
  // Nothing is invented: the supplier's phone was never given.
  await expect(fields.locator('[data-field="respondent.phone"]')).toContainText(
    en["review.notProvided"],
  );

  // Correct a detail before confirming.
  const goods = fields.locator('[data-field="transaction.goods"]');
  await goods.getByRole("button", { name: /Edit/ }).click();
  await goods.getByRole("textbox").fill("50 bags of sugar");
  await goods.getByRole("button", { name: en["review.save"] }).click();
  await expect(goods).toContainText("50 bags of sugar");

  const generate = page.getByRole("button", { name: en["review.generate"] });
  await expect(generate).toBeDisabled();
  await page.getByLabel(en["review.confirm"]).check();
  await generate.click();
  await expect(page.getByText(en["review.generated"])).toBeVisible();

  const link = page.getByRole("link", { name: en["review.download"].replace("{n}", "1") });
  const res = await page.request.get((await link.getAttribute("href")) as string);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");
  expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // The case shows on the dashboard with its new status.
  await page.goto("/cases");
  await expect(page.getByTestId("case-row").first()).toContainText(en["status.report_generated"]);
  expect(caseId).toBeTruthy();
});

test("a Luganda voice note is transcribed, checked, and kept with its English reading", async ({
  page,
}) => {
  await register(page, { language: "Oluganda" });
  await startCase(page);
  const mic = page.getByRole("button", { name: en["mic.record"] });
  await mic.click();
  await page.getByRole("button", { name: en["mic.stop"] }).click();
  await expect(page.getByLabel(en["intake.label"])).toHaveValue(MOCK_TRANSCRIPT);
  await page.getByRole("button", { name: en["intake.send"] }).click();
  const said = page.getByTestId("trader-message").first();
  await expect(said).toContainText(MOCK_TRANSCRIPT);
  await expect(said).toContainText(MOCK_ENGLISH);
});

test("one trader can't open another trader's case", async ({ page, browser }) => {
  await register(page);
  const caseId = await startCase(page);

  const other = await browser.newContext();
  const stranger = await other.newPage();
  expect((await stranger.request.get(`/api/cases/${caseId}`)).status()).toBe(401);
  await stranger.request.post("/api/session");
  expect((await stranger.request.get(`/api/cases/${caseId}`)).status()).toBe(404);
  await other.close();
});

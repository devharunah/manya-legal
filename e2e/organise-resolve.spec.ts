import { type Page, expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";

import { register, say, startCase } from "./helpers";

// A 1x1 PNG. In e2e the document is "read" from its file name (E2E_MOCK_LLM).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function reportReady(page: Page) {
  await register(page);
  const id = await startCase(page);
  await say(
    page,
    "I paid the supplier 2,000,000 shillings on 10 November 2026 but the goods were never delivered.",
  );
  await expect(page.getByTestId("manya-message").last()).toHaveText(en["q.respondent.name"]);
  await say(page, "Kato Wholesalers");
  await expect(page.getByTestId("manya-message").last()).toHaveText(en["q.transaction.goods"]);
  await page.getByRole("button", { name: en["intake.reviewNow"] }).click();
  await page.getByLabel(en["review.confirm"]).check();
  await page.getByRole("button", { name: en["review.generate"] }).click();
  await expect(page.getByText(en["review.generated"])).toBeVisible();
  return id;
}

test("PRD 13 tests 2 and 3: organise evidence, see options, and prepare a consented referral", async ({
  page,
}) => {
  await reportReady(page);

  // ── Organise ──
  await page.getByRole("tab", { name: en["case.tabOrganise"] }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "momo-receipt-1500000-2026-11-10.png",
      mimeType: "image/png",
      buffer: PNG,
    });
  const card = page.getByTestId("evidence-card");
  await expect(card).toContainText("momo-receipt-1500000-2026-11-10.png");
  await expect(card).toContainText(en["evidence.notVerified"]);
  await expect(card.getByTestId("consistency-flag")).toContainText(en["consistency.amount"]);
  await expect(card.getByTestId("consistency-flag")).toContainText("1,500,000");

  // The trader confirms what was read; the flag stays until they change the report or the document.
  await card.getByRole("button", { name: en["evidence.confirm"] }).click();
  await expect(card).toContainText(en["evidence.confirmed"]);
  await expect(page.getByText(en["evidence.timeline"])).toBeVisible();

  // A disguised file is refused.
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "receipt.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
  await expect(page.getByRole("alert").filter({ hasText: "Upload a PDF, JPG or PNG." })).toBeVisible();

  // ── Resolve ──
  await page.getByRole("tab", { name: en["case.tabResolve"] }).click();
  await expect(page.getByTestId("pathway-negotiation")).toBeVisible();
  await expect(page.getByTestId("pathway-mediation")).toBeVisible();
  await expect(page.getByTestId("pathway-arbitration")).toHaveCount(0);
  const smallClaims = page.getByTestId("pathway-small_claims");
  await expect(smallClaims).toContainText(en["resolve.status.requires_further_assessment"]);
  await expect(smallClaims).toContainText("UGX 2,000,000");
  await smallClaims.getByText(en["resolve.sources"], { exact: false }).click();
  await expect(smallClaims.getByTestId("law-excerpt").first()).toContainText(
    "ten million Uganda shillings",
  );

  await page
    .getByTestId("pathway-mediation")
    .getByRole("button", { name: en["resolve.prepare"] })
    .click();
  await page.getByLabel("momo-receipt-1500000-2026-11-10.png").check();
  await page.getByRole("button", { name: en["referral.create"] }).click();
  await expect(page.getByRole("alert").filter({ hasText: en["referral.needConsent"] })).toBeVisible();
  await page.getByLabel(/I give my consent/).check();
  await page.getByRole("button", { name: en["referral.create"] }).click();
  await expect(page.getByText(en["referral.ready"])).toBeVisible();

  const link = page.getByRole("link", {
    name: new RegExp(en["referral.download"].replace(/[()]/g, "\\$&")),
  });
  const res = await page.request.get((await link.getAttribute("href")) as string);
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("legal support lists providers with their verification status and sources", async ({
  page,
}) => {
  await page.goto("/legal-support");
  await expect(page.getByTestId("provider-card").first()).toBeVisible();
  await expect(page.getByText(en["provider.verified"]).first()).toBeVisible();
  await expect(page.getByText(en["provider.verification_pending"]).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Small Claims Procedure Rules" })).toBeVisible();
});

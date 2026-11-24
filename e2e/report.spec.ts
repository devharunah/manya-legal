import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";
import { MOCK_ENGLISH, MOCK_TRANSCRIPT } from "../src/lib/voice/mock";

import { label, register, say, startCase } from "./helpers";

// The recorder needs a real (fake-device) microphone, which the headless shell lacks.
test.use({
  channel: "chromium",
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  permissions: ["microphone"],
});

test("six-stage intake: report a non-delivery in five answers, review, confirm and get the PDF", async ({
  page,
}) => {
  await register(page);
  await startCase(page);
  const last = () => page.getByTestId("manya-message").last();
  await expect(page.getByTestId("intake-step")).toContainText("Step 1 of 6");

  // Stage 1: the trader's own account.
  await say(
    page,
    "I paid Daniel Okello of Okello Wholesale Supplies UGX 2,000,000 by mobile money on 10 November 2026 for household merchandise. He promised delivery by 12 November 2026 but no goods have been delivered.",
  );
  await expect(page.getByText(en["intake.understood"])).toBeVisible();
  // Stage 2: the agreement and any dispute-resolution clause, in one question.
  await expect(last()).toHaveText(en["ask.agreement"]);
  await say(
    page,
    "We did not sign a formal contract. We agreed on WhatsApp and he sent me an invoice. There is nothing about arbitration or mediation in it.",
  );
  // Stage 3: only what is missing (the supplier's contact); amount, date and goods were already given.
  await expect(last()).toHaveText(en["ask.parties"]);
  await say(page, "His number is +256 700 000 202.");
  // Stage 4: what happened after payment.
  await expect(last()).toHaveText(en["ask.events"]);
  await say(
    page,
    "On 14 November 2026 I messaged him and he said there was a delay with transport. On 18 November 2026 I followed up again.",
  );
  // Stage 5: outcome and records.
  await expect(last()).toHaveText(en["ask.outcome"]);
  await say(
    page,
    "I want the merchandise delivered or a refund of my money. I have the mobile money confirmation and the WhatsApp chat.",
  );
  // Stage 6: review.
  await expect(last()).toHaveText(en["intake.done"]);

  const fields = page.getByTestId("report-fields");
  await expect(fields.locator('[data-field="transaction.amount"]')).toContainText("2,000,000");
  await expect(fields.locator('[data-field="respondent.name"]')).toContainText("Daniel Okello");
  await expect(fields.locator('[data-field="transaction.agreement_type"]')).toContainText(
    "WhatsApp",
  );
  await expect(fields.locator('[data-field="arbitration_agreement"]')).toContainText("No");
  await expect(fields.locator('[data-field="mediation_clause"]')).toContainText("No");
  await expect(page.getByTestId("review-events")).toContainText("18 November 2026");

  // The trader corrects a detail before confirming.
  const goods = fields.locator('[data-field="transaction.goods"]');
  await goods.getByRole("button", { name: /Edit/ }).click();
  await goods
    .getByRole("textbox")
    .fill("Household storage containers, kitchen utensils and cleaning accessories");
  await goods.getByRole("button", { name: en["review.save"] }).click();
  await expect(goods).toContainText("kitchen utensils");

  // The AI summary streams in from the trader's own answers.
  const summary = page.getByTestId("case-summary");
  await summary.getByRole("button", { name: en["summary.create"] }).click();
  await expect(summary).toContainText("You reported that you paid Daniel Okello UGX 2,000,000");

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

  // Resolve: no clause identified, so negotiation, voluntary mediation and court options; no arbitration.
  await page.getByRole("tab", { name: en["case.tabResolve"] }).click();
  await expect(page.getByTestId("resolve-disclaimer")).toHaveText(en["resolve.disclaimer"]);
  await expect(page.getByTestId("pathway-negotiation")).toBeVisible();
  await expect(page.getByTestId("pathway-mediation")).toContainText(
    en["pathway.mediation.whyNoClause"],
  );
  await expect(page.getByTestId("pathway-arbitration")).toHaveCount(0);
  await expect(page.getByTestId("pathway-small_claims")).toContainText(
    en["resolve.status.requires_further_assessment"],
  );

  await page.goto("/cases");
  await expect(page.getByTestId("case-row").first()).toContainText(en["status.report_generated"]);
});

test("all four SAMPLE documents upload to the right case and are never called authentic", async ({
  page,
}) => {
  await register(page);
  const first = await startCase(page);
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
  const cards = page.getByTestId("evidence-card");
  await expect(cards.nth(0).getByRole("combobox")).toHaveValue("payment_evidence");
  await expect(cards.nth(1).getByRole("combobox")).toHaveValue("transaction_evidence");
  await expect(cards.nth(2).getByRole("combobox")).toHaveValue("communication_evidence");
  for (const i of [0, 1, 2, 3])
    await expect(cards.nth(i)).toContainText(en["evidence.notVerified"]);

  // A second case of the same trader sees none of them.
  await page.goto("/dashboard");
  const second = await startCase(page);
  expect(second).not.toBe(first);
  const docs = (await (await page.request.get(`/api/cases/${second}`)).json()) as {
    documents: unknown[];
  };
  expect(docs.documents).toHaveLength(0);
});
test("a Luganda voice note is transcribed, checked, and kept with its English reading", async ({
  page,
}) => {
  await register(page, { language: "Oluganda" });
  await startCase(page, "lug");
  const box = page.getByLabel(label("lug", "intake.label"));
  await page.getByRole("button", { name: label("lug", "mic.record") }).click();
  await expect(page.getByText(label("lug", "mic.listening")).first()).toBeVisible();
  // Live transcription: the words appear in the box while still recording.
  await expect(box).toHaveValue(MOCK_TRANSCRIPT, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: label("lug", "mic.stop") })).toBeVisible();
  // The square stops listening and leaves the text to check.
  await page.getByRole("button", { name: label("lug", "mic.stop") }).click();
  await expect(page.getByRole("button", { name: label("lug", "mic.record") })).toBeVisible();
  await expect(box).toHaveValue(MOCK_TRANSCRIPT);
  // The arrow sends it.
  await page.getByRole("button", { name: label("lug", "intake.send") }).click();
  const said = page.getByTestId("trader-message").first();
  await expect(said).toContainText(MOCK_TRANSCRIPT);
  await expect(said).toContainText(MOCK_ENGLISH);
  // MANYA's next question shows in Luganda.
  await expect(page.getByTestId("manya-message").last()).toHaveText(label("lug", "ask.agreement"));
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

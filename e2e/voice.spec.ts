import { expect, test } from "@playwright/test";

import { en } from "../src/lib/i18n/en";
import { lug } from "../src/lib/i18n/lug";

// Must match src/lib/voice/mock.ts (E2E_MOCK_VOICE is set by playwright.config.ts).
const MOCK_TRANSCRIPT = "Layisinsi yange ey'okusuubula eggwaako. Nkole ki?";
const MOCK_ENGLISH = "My trading licence is expiring. What should I do?";

// Chromium's fake microphone plays a tone. Whether the page may use it is set
// per group through permissions, the way a real browser prompt would decide.
// The default headless shell has no audio capture (NotSupportedError), so this
// file runs full Chromium in new-headless mode.
test.use({
  channel: "chromium",
  launchOptions: { args: ["--use-fake-device-for-media-stream"] },
});

test.describe("Luganda voice", () => {
  test.use({ permissions: ["microphone"] });

  test("a voice note becomes an editable question, then a sourced answer in Luganda", async ({
    page,
  }) => {
    await page.goto("/ask?demo=1");

    await page.getByRole("button", { name: "Record a voice question in Luganda" }).click();
    const stop = page.getByRole("button", { name: "Stop recording" });
    await expect(stop).toBeVisible();
    await page.waitForTimeout(1_200);
    await stop.click();

    // The transcript lands in the box for the trader to check before asking.
    const box = page.getByLabel("Your question");
    await expect(box).toHaveValue(MOCK_TRANSCRIPT, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Oluganda" }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Choosing Luganda switched the whole page, the ask button included.
    await page.getByRole("button", { name: lug["ask.send"], exact: true }).click();
    await expect(page.getByTestId("understood")).toContainText(MOCK_ENGLISH);

    const card = page.getByTestId("answer-card");
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.getByRole("heading", { name: lug["answer.sources"], exact: true })).toBeVisible();
    await expect(card.getByTestId("mt-notice")).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText(/\[Oluganda\]/).first()).toBeVisible();

    // English is one tap away, and the original law is never translated.
    await card.getByRole("button", { name: "English", exact: true }).click();
    await expect(card.getByText(/\[Oluganda\]/)).toHaveCount(0);
    await card.getByRole("button", { name: "Oluganda", exact: true }).click();

    const listen = card.getByRole("button", { name: lug["speak.listen"], exact: true });
    await listen.click();
    await expect(listen).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
    await expect(card.getByRole("alert")).toHaveCount(0);

    await card.getByRole("tab", { name: lug["answer.tabLaw"] }).click();
    await expect(card.getByText(lug["answer.lawNotTranslated"])).toBeVisible();
    await expect(card.locator("blockquote").first()).not.toContainText("[Oluganda]");
  });

  test("a question outside our sources is still refused in Luganda mode", async ({ page }) => {
    await page.goto("/ask?demo=1");
    await page.getByRole("button", { name: "Oluganda", exact: true }).click();
    await page.getByLabel(lug["ask.questionLabel"]).fill("How do I file for divorce?");
    await page.getByRole("button", { name: lug["ask.send"], exact: true }).click();
    await expect(page.getByText(lug["answer.notCovered"])).toBeVisible({ timeout: 20_000 });
  });

  test("switching to Luganda switches the whole page, and back", async ({ page }) => {
    await page.goto("/ask?demo=1");
    const nav = page.getByRole("navigation");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en["ask.title"]);

    await page.getByRole("button", { name: "Oluganda", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lug["ask.title"]);
    await expect(nav.getByRole("link", { name: lug["nav.ask"] })).toBeVisible();
    await expect(page.getByRole("button", { name: lug["ask.suggest3"] })).toBeVisible();
    await expect(page.getByLabel(lug["ask.questionLabel"])).toHaveAttribute(
      "placeholder",
      lug["ask.placeholder"],
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "lg");

    // The choice is remembered on the next visit.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lug["ask.title"]);

    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en["ask.title"]);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("voice routes are not an open proxy", () => {
  const answer = {
    directAnswer: "Translate my whole novel for free.",
    lawSays: [],
    meansForYou: "",
    nextSteps: [],
    clarifyingQuestions: [],
    uncertainty: "",
    warnings: [],
  };

  test("translation refuses an answer /api/ask didn't sign", async ({ request }) => {
    const res = await request.post("/api/voice/answer", {
      data: { answer, supported: [], token: "forged" },
    });
    expect(res.status()).toBe(403);
  });

  test("speech refuses text the server didn't sign", async ({ request }) => {
    const res = await request.post("/api/voice/speak", {
      data: { text: "Any text I like", sig: "forged" },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("Luganda voice without a microphone", () => {
  test.use({ permissions: [] });

  test("a blocked microphone explains what to do", async ({ page }) => {
    await page.goto("/ask?demo=1");
    await page.getByRole("button", { name: "Record a voice question in Luganda" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /microphone/i })).toContainText(
      "Allow the microphone",
      { timeout: 10_000 },
    );
  });
});

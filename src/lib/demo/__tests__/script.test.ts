/** @jest-environment node */
import { createMemoryStore } from "@/lib/db/memory";
import { intakeTurn } from "@/lib/intake/engine";
import { FIELDS, emptyIntake } from "@/lib/intake/fields";
import { mergeExtraction } from "@/lib/intake/merge";
import { prefillFromProfile } from "@/lib/intake/prefill";
import { completion } from "@/lib/intake/progress";

import { DEMO_PROFILE } from "../cases";
import { LIVE_SCRIPT, type ScriptKey, scriptedExtract, suggestedAnswer } from "../script";

/** The live-demo wiring from the messages route, with AI forbidden. */
const aiCalls: string[] = [];
const deps = {
  extract: async (english: string) => {
    const scripted = scriptedExtract(english);
    if (scripted) return scripted;
    aiCalls.push(english);
    return { extraction: {}, category: null, events: [], by: "rules" as const };
  },
  toEnglish: async (text: string) => text,
};

async function liveCase() {
  const store = createMemoryStore(`live-${Math.random()}`);
  const blank = await store.createCase("en");
  const record = await store.updateCase(blank.id, {
    intake: { ...prefillFromProfile(blank.intake, DEMO_PROFILE), demo: "live" },
  });
  return { store, record };
}

describe("live demo script", () => {
  beforeEach(() => {
    aiCalls.length = 0;
  });

  it("runs from the opening to review without AI, retries or refusals", async () => {
    const { store, record } = await liveCase();
    let current = record;
    let lastKey: string | null = null;
    const asked: string[] = [];

    for (let round = 0; round < 8; round++) {
      if (round > 0 && current.status !== "collecting_information") break;
      const text = suggestedAnswer(lastKey, round > 0);
      expect(text).not.toBeNull();
      const r = await intakeTurn(
        store,
        current,
        { kind: "message", text: text as string, inputType: "text" },
        deps,
      );
      current = r.case;
      const manya = r.added.filter((m) => m.sender === "manya").map((m) => m.originalText);
      expect(manya).not.toContain("intake.retry");
      expect(manya).not.toContain("intake.otherCategory");
      lastKey = manya.at(-1) ?? null;
      if (lastKey?.startsWith("ask.")) asked.push(lastKey);
    }

    expect(aiCalls).toEqual([]);
    expect(current.status).toBe("awaiting_user_confirmation");
    expect(completion(current.intake)).toBe(100);
    expect(current.intake.workflow?.rounds).toBeLessThanOrEqual(6);
    expect(asked).toEqual(["ask.agreement", "ask.parties", "ask.events", "ask.outcome"]);
    expect(current.intake.demo).toBe("live");
    expect(current.intake.values["respondent.phone"]?.value).toBe("+256 700 000 202");
    expect(current.intake.events?.length).toBeGreaterThanOrEqual(4);
  });

  it("has an answer for every question MANYA can ask", () => {
    const keys: ScriptKey[] = [
      "opening",
      "ask.agreement",
      "ask.agreementClauses",
      "ask.parties",
      "ask.partiesBoth",
      "ask.transaction",
      "ask.events",
      "ask.outcome",
      "ask.evidence",
      "ask.clarify",
    ];
    for (const key of keys) expect(LIVE_SCRIPT[key].text.length).toBeGreaterThan(10);
    expect(suggestedAnswer("intake.done", true)).toBeNull();
  });

  it.each(Object.entries(LIVE_SCRIPT))(
    "keeps every prepared value for %s (grounded in its own words)",
    (_key, turn) => {
      const { dropped, accepted } = mergeExtraction(
        emptyIntake(),
        turn.reading.extraction,
        turn.text,
      );
      expect(dropped).toEqual([]);
      const known = new Set<string>(FIELDS.map((f) => f.key));
      for (const key of Object.keys(turn.reading.extraction)) {
        expect(known.has(key)).toBe(true);
        expect(accepted).toContain(key);
      }
    },
  );

  it("matches the answer despite case, spacing and final punctuation, not edits", () => {
    const text = LIVE_SCRIPT["ask.parties"].text;
    expect(scriptedExtract(`  ${text.toUpperCase().replace(/\.$/, "")}  `)).not.toBeNull();
    expect(scriptedExtract(text.replace("202", "203"))).toBeNull();
    expect(scriptedExtract("Hello, what can you do?")).toBeNull();
  });

  it("sends anything else to the normal reading", async () => {
    const { store, record } = await liveCase();
    await intakeTurn(
      store,
      record,
      { kind: "message", text: "Hello there", inputType: "text" },
      deps,
    );
    expect(aiCalls).toEqual(["Hello there"]);
  });
});

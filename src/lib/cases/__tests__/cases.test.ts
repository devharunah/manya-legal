/** @jest-environment node */
import { createMemoryStore } from "@/lib/db/memory";
import { type ExtractContext, TranslationError, intakeTurn } from "@/lib/intake/engine";
import { heuristicExtract } from "@/lib/intake/heuristic";
import { prefillFromProfile } from "@/lib/intake/prefill";

import { TransitionError, canMove, move } from "../state";
import type { Profile } from "../types";

const PROFILE: Profile = {
  fullName: "Nakato Sarah",
  phone: "0772123456",
  preferredLanguage: "lug",
  businessName: "Nakato General Store",
  businessType: "general_retail",
  location: "Kikuubo",
};

const deps = {
  extract: async (text: string, ctx: ExtractContext) => ({
    ...heuristicExtract(text, ctx.asking),
    by: "rules" as const,
  }),
  toEnglish: async (text: string) => text,
};

describe("case workflow", () => {
  it("allows only the PRD transitions", () => {
    expect(canMove("draft", "collecting_information")).toBe(true);
    expect(canMove("draft", "report_generated")).toBe(false);
    expect(canMove("completed", "collecting_information")).toBe(false);
    expect(() => move("collecting_information", "completed")).toThrow(TransitionError);
  });
});

describe("store isolation", () => {
  it("never shows one trader's case to another", async () => {
    const a = createMemoryStore(`a-${Math.random()}`);
    const b = createMemoryStore(`b-${Math.random()}`);
    const created = await a.createCase("en");
    expect(await b.getCase(created.id)).toBeNull();
    expect(await b.listCases()).toEqual([]);
    await expect(
      b.addMessage({
        caseId: created.id,
        sender: "trader",
        originalText: "x",
        processedText: null,
        language: "en",
        inputType: "text",
        field: null,
      }),
    ).rejects.toThrow();
    await a.putFile(`${a.userId}/f.pdf`, new Uint8Array([1]), "application/pdf");
    expect(await b.getFile(`${a.userId}/f.pdf`)).toBeNull();
  });
});

async function freshCase(language: "en" | "lug" = "en") {
  const store = createMemoryStore(`t-${Math.random()}`);
  const blank = await store.createCase(language);
  const record = await store.updateCase(blank.id, {
    intake: prefillFromProfile(blank.intake, PROFILE),
  });
  return { store, record };
}

const say = (text: string) => ({ kind: "message" as const, text, inputType: "text" as const });
const lastAsk = (added: { sender: string; originalText: string }[]) =>
  [...added].reverse().find((m) => m.sender === "manya")?.originalText;

describe("six-stage intake", () => {
  it("runs the fictional demo story in at most six rounds, never repeating a question", async () => {
    const { store, record } = await freshCase();
    const answers = [
      "I paid Daniel Okello of Okello Wholesale Supplies UGX 2,000,000 by mobile money on 10 November 2026 for household merchandise. He promised delivery by 12 November 2026 but no goods have been delivered.",
      "We did not sign a formal contract. We agreed on WhatsApp and he sent me an invoice. There is nothing about arbitration or mediation in it.",
      "His number is +256 700 000 202.",
      "On 14 November 2026 I messaged him and he said there was a delay with transport. On 18 November 2026 I followed up again.",
      "I want the merchandise delivered or a refund of my money. I have the mobile money confirmation, the invoice and the WhatsApp chat.",
    ];
    let current = record;
    const asked: string[] = [];
    for (const text of answers) {
      const turn = await intakeTurn(store, current, say(text), deps);
      current = turn.case;
      const q = lastAsk(turn.added);
      if (q?.startsWith("ask.")) asked.push(q);
    }
    expect(asked).toEqual(["ask.agreement", "ask.parties", "ask.events", "ask.outcome"]);
    expect(new Set(asked).size).toBe(asked.length);
    expect(current.status).toBe("awaiting_user_confirmation");
    expect(current.intake.workflow?.rounds).toBeLessThanOrEqual(6);
    const v = current.intake.values;
    expect(v["respondent.name"]?.value).toBe("Daniel Okello");
    expect(v["transaction.amount"]?.value).toBe(2_000_000);
    expect(v["transaction.agreement_type"]?.value).toBe("whatsapp");
    expect(v.arbitration_agreement?.value).toBe("no");
    expect(v.mediation_clause?.value).toBe("no");
    expect(v.requested_resolution?.value).toBe("delivery_or_refund");
    expect(current.intake.events?.map((e) => e.date)).toEqual(
      expect.arrayContaining(["2026-11-14", "2026-11-18"]),
    );
  });

  it("asks only for what is missing, and clarifies a critical gap once", async () => {
    const { store, record } = await freshCase();
    let turn = await intakeTurn(
      store,
      record,
      say(
        "I paid Daniel Okello UGX 2,000,000 on 10 November 2026 for 40 bags of sugar but nothing has arrived.",
      ),
      deps,
    );
    expect(lastAsk(turn.added)).toBe("ask.agreement");
    // The trader answers how the deal was made but not the clauses.
    turn = await intakeTurn(store, turn.case, say("We agreed on WhatsApp."), deps);
    const clarify = [...turn.added].reverse().find((m) => m.sender === "manya");
    expect(clarify?.originalText).toBe("ask.clarify");
    expect(clarify?.field).toBe("arbitration_agreement,mediation_clause");
    // "I don't know" covers both, and the conversation moves on without asking again.
    turn = await intakeTurn(store, turn.case, { kind: "skip" }, deps);
    expect(turn.case.intake.unknown).toEqual(
      expect.arrayContaining(["arbitration_agreement", "mediation_clause"]),
    );
    expect(lastAsk(turn.added)).not.toBe("ask.clarify");
    expect(lastAsk(turn.added)).not.toBe("ask.agreement");
  });

  it("goes to review with gaps marked, rather than inventing them", async () => {
    const { store, record } = await freshCase();
    let current = record;
    let turn = await intakeTurn(store, current, say("My supplier never delivered."), deps);
    for (let i = 0; i < 10 && turn.case.status === "collecting_information"; i++) {
      turn = await intakeTurn(store, turn.case, { kind: "skip" }, deps);
    }
    current = turn.case;
    expect(current.status).toBe("awaiting_user_confirmation");
    expect(turn.added.at(-1)?.originalText).toBe("intake.doneMissing");
    expect(current.intake.values["transaction.amount"]).toBeUndefined();
  });

  it("keeps the Luganda original and the English it was read as", async () => {
    const { store, record } = await freshCase("lug");
    const result = await intakeTurn(
      store,
      record,
      { kind: "message", text: "Nasasula 2,000,000", inputType: "voice" },
      {
        ...deps,
        toEnglish: async () => "I paid 2,000,000 shillings",
      },
    );
    const said = result.added.find((m) => m.sender === "trader");
    expect(said?.originalText).toBe("Nasasula 2,000,000");
    expect(said?.processedText).toBe("I paid 2,000,000 shillings");
    expect(result.case.intake.narrative).toBe("Nasasula 2,000,000");
  });

  it("refuses a translation that loses a number the trader wrote", async () => {
    const { store, record } = await freshCase("lug");
    await expect(
      intakeTurn(
        store,
        record,
        { kind: "message", text: "Nasasula 2,000,000", inputType: "text" },
        {
          ...deps,
          toEnglish: async () => "I paid 200,000",
        },
      ),
    ).rejects.toThrow(TranslationError);
  });
});

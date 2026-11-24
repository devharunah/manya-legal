/** @jest-environment node */
import { createMemoryStore } from "@/lib/db/memory";
import { TranslationError, intakeTurn } from "@/lib/intake/engine";
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
  extract: async (text: string, asked: Parameters<typeof heuristicExtract>[1]) => ({
    ...heuristicExtract(text, asked),
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

describe("intakeTurn", () => {
  it("extracts the story, asks for what is missing, and never invents the rest", async () => {
    const store = createMemoryStore(`t-${Math.random()}`);
    const blank = await store.createCase("en");
    const record = await store.updateCase(blank.id, {
      intake: prefillFromProfile(blank.intake, PROFILE),
    });

    const first = await intakeTurn(
      store,
      record,
      {
        kind: "message",
        text: "I paid the supplier 2,000,000 shillings on 10 November 2026 but they never delivered.",
        inputType: "text",
      },
      deps,
    );
    expect(first.case.status).toBe("collecting_information");
    expect(first.case.category).toBe("supplier_non_delivery");
    expect(first.case.intake.values["transaction.amount"]?.value).toBe(2_000_000);
    expect(first.case.intake.values["respondent.name"]).toBeUndefined();
    const question = first.added.at(-1);
    expect(question?.originalText).toBe("q.respondent.name");
    expect(question?.field).toBe("respondent.name");

    const second = await intakeTurn(
      store,
      first.case,
      { kind: "message", text: "Kato Traders", inputType: "text" },
      deps,
    );
    expect(second.case.intake.values["respondent.name"]?.value).toBe("Kato Traders");

    const skipped = await intakeTurn(
      store,
      second.case,
      { kind: "skip", field: "transaction.goods" },
      deps,
    );
    expect(skipped.case.intake.unknown).toContain("transaction.goods");
    expect(skipped.added.at(-1)?.field).not.toBe("transaction.goods");
  });

  it("keeps the Luganda original and the English it was read as", async () => {
    const store = createMemoryStore(`l-${Math.random()}`);
    const record = await store.createCase("lug");
    const result = await intakeTurn(
      store,
      record,
      { kind: "message", text: "Nasasula 2,000,000", inputType: "voice" },
      { ...deps, toEnglish: async () => "I paid 2,000,000 shillings" },
    );
    const said = result.added.find((m) => m.sender === "trader");
    expect(said?.originalText).toBe("Nasasula 2,000,000");
    expect(said?.processedText).toBe("I paid 2,000,000 shillings");
    expect(result.case.intake.narrative).toBe("Nasasula 2,000,000");
  });

  it("refuses a translation that loses a number the trader wrote", async () => {
    const store = createMemoryStore(`x-${Math.random()}`);
    const record = await store.createCase("lug");
    await expect(
      intakeTurn(
        store,
        record,
        { kind: "message", text: "Nasasula 2,000,000", inputType: "text" },
        { ...deps, toEnglish: async () => "I paid 200,000" },
      ),
    ).rejects.toThrow(TranslationError);
  });
});

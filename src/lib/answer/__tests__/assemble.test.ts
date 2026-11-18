import { retrieve } from "@/lib/kb/retrieve";

import { DEMO_PROFILE } from "@/lib/profile";
import { refusal, sourcesOnly, validateModelAnswer } from "../assemble";
import { buildPrompt } from "../prompt";
import type { ModelAnswer } from "../types";

const hits = retrieve(
  "What could happen if I operate my shop without the required trading licence?",
).hits;

function model(overrides: Partial<ModelAnswer> = {}): ModelAnswer {
  return {
    status: "answered",
    directAnswer: "Trading without a licence is an offence.",
    lawSays: [{ point: "You must hold a trading licence.", chunkIds: ["kcca-notice-offence"] }],
    meansForYou: "Your shop needs a licence.",
    nextSteps: ["Go to KCCA."],
    clarifyingQuestions: [],
    uncertainty: "Fine amounts are not confirmed.",
    needsLawyer: false,
    ...overrides,
  };
}

describe("validateModelAnswer", () => {
  it("keeps citations to retrieved chunks and exposes their sources", () => {
    const answer = validateModelAnswer(model(), hits);
    expect(answer.lawSays[0]?.supported).toBe(true);
    expect(answer.sources.map((s) => s.chunkId)).toEqual(["kcca-notice-offence"]);
    expect(answer.warnings).toHaveLength(0);
  });

  it("drops invented citations and marks the claim unsupported", () => {
    const answer = validateModelAnswer(
      model({ lawSays: [{ point: "Section 99 says so.", chunkIds: ["made-up-s99"] }] }),
      hits,
    );
    expect(answer.lawSays[0]).toEqual({
      point: "Section 99 says so.",
      chunkIds: [],
      supported: false,
    });
    expect(answer.status).toBe("partial");
    expect(answer.warnings.join(" ")).toMatch(/could not be matched/);
  });

  it("warns about money amounts that are not in the knowledge base", () => {
    const answer = validateModelAnswer(
      model({ meansForYou: "You may pay a fine of UGX 500,000." }),
      hits,
    );
    expect(answer.warnings.join(" ")).toMatch(/UGX 500,000/);
  });
});

describe("fallbacks", () => {
  it("refusal cites nothing and points to legal aid", () => {
    const answer = refusal();
    expect(answer.sources).toHaveLength(0);
    expect(answer.referrals.length).toBeGreaterThan(0);
  });

  it("sources-only shows real chunks without interpretation", () => {
    const answer = sourcesOnly(hits);
    expect(answer.mode).toBe("sources-only");
    expect(answer.sources.length).toBeGreaterThan(0);
  });
});

describe("buildPrompt", () => {
  it("includes the profile, labelled chunks with currency, and the question", () => {
    const prompt = buildPrompt("Is it legal?", DEMO_PROFILE, hits);
    expect(prompt).toContain("Kikuubo");
    expect(prompt).toContain("[kcca-notice-offence]");
    expect(prompt).toMatch(/Status: (CURRENT|SECONDARY|HISTORICAL)/);
    expect(prompt).toContain("Is it legal?");
  });
});

import type { AnswerText } from "@/lib/answer/types";

import { MAX_PIECE, speechPieces, spokenAnswer } from "../speech-text";

describe("speechPieces", () => {
  it("groups short sentences into one piece", () => {
    expect(speechPieces("Genda e KCCA. Twala TIN yo.")).toEqual(["Genda e KCCA. Twala TIN yo."]);
  });

  it("never exceeds the limit and splits on sentence boundaries", () => {
    const pieces = speechPieces("One two three. Four five six. Seven eight nine.", 20);
    expect(pieces).toEqual(["One two three.", "Four five six.", "Seven eight nine."]);
  });

  it("breaks an over-long sentence between words", () => {
    const long = Array.from({ length: 120 }, (_, i) => `word${i}`).join(" ");
    const pieces = speechPieces(long);
    expect(pieces.length).toBeGreaterThan(1);
    for (const p of pieces) expect(p.length).toBeLessThanOrEqual(MAX_PIECE);
    expect(pieces.join(" ")).toBe(long);
  });

  it("returns nothing for blank text", () => {
    expect(speechPieces("   ")).toEqual([]);
  });
});

describe("spokenAnswer", () => {
  const english: AnswerText = {
    directAnswer: "Renew at KCCA",
    lawSays: ["You need a licence.", "Unsourced claim.", "Valid for 12 months."],
    meansForYou: "",
    nextSteps: ["Go to the division office"],
    clarifyingQuestions: ["Not read?"],
    uncertainty: "Fees may change.",
    warnings: ["1 statement is marked."],
  };
  const lg = (s: string) => (s ? `LG ${s}` : s);
  const luganda: AnswerText = {
    ...english,
    directAnswer: lg(english.directAnswer),
    // The third line was kept in English by the number check.
    lawSays: [lg("You need a licence."), lg("Unsourced claim."), "Valid for 12 months."],
    nextSteps: english.nextSteps.map(lg),
    clarifyingQuestions: english.clarifyingQuestions.map(lg),
    uncertainty: lg(english.uncertainty),
    warnings: english.warnings.map(lg),
  };

  const { all, steps } = spokenAnswer(english, luganda, [true, false, true]);
  const spoken = all.join(" ");

  it("never reads a law point that has no source", () => {
    expect(spoken).not.toContain("Unsourced");
  });

  it("skips lines left in English instead of reading them with a Luganda voice", () => {
    expect(spoken).not.toContain("12 months");
  });

  it("reads the caveats as well as the answer", () => {
    expect(spoken).toBe(
      "LG Renew at KCCA. LG You need a licence. LG Go to the division office. LG Fees may change. LG 1 statement is marked.",
    );
  });

  it("offers the steps on their own", () => {
    expect(steps).toEqual(["LG Go to the division office."]);
  });
});

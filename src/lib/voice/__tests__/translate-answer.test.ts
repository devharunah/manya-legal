import type { AnswerText } from "@/lib/answer/types";

import { keepsNumbers, numbersIn, translateAnswerText } from "../translate-answer";

const ANSWER: AnswerText = {
  directAnswer: "Renew your trading licence at KCCA before it expires.",
  lawSays: [
    "Section 8(1) says you need a licence for each premises.",
    "The licence is valid for 12 months from the date it is issued.",
  ],
  meansForYou: "Your shop in Kikuubo likely needs a renewal now.",
  nextSteps: ["Take your TIN certificate and 2 passport photos to the KCCA division office."],
  clarifyingQuestions: [],
  uncertainty: "The fee for your area is set by KCCA.",
  warnings: [],
};

const tag = async (s: string) => `LG ${s}`;

describe("numbersIn", () => {
  it("keeps section numbers whole and drops small counts", () => {
    expect(numbersIn("Section 8(1) and 2 photos, 12 months, UGX 150,000.")).toEqual([
      "8(1)",
      "12",
      "150000",
    ]);
  });
});

describe("keepsNumbers", () => {
  it("passes when a translator writes a small count as a word", () => {
    expect(keepsNumbers("2 passport photos", "ebifaananyi ebibiri")).toBe(true);
  });

  it("fails when a period or amount goes missing", () => {
    expect(keepsNumbers("valid for 12 months", "ekola emyezi kkumi n'ebiri")).toBe(false);
    expect(keepsNumbers("UGX 150,000", "UGX 15,000")).toBe(false);
  });

  it("matches amounts written with or without thousands separators", () => {
    expect(keepsNumbers("UGX 150,000", "UGX 150000")).toBe(true);
  });

  it("fails when the translation adds an amount the English didn't have", () => {
    expect(keepsNumbers("Pay the fee for your area.", "Sasula UGX 200,000.")).toBe(false);
  });

  it("fails when a time limit is swapped, even a single digit", () => {
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku 30.")).toBe(false);
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku musanvu.")).toBe(false);
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku 7.")).toBe(true);
  });

  it("checks a sub-section like 8(1) whole, not its first digit alone", () => {
    expect(numbersIn("Section 8(1) applies")).toEqual(["8(1)"]);
  });

  it("treats a single-digit section number as significant", () => {
    expect(numbersIn("Under section 5 you must")).toEqual(["5"]);
    expect(keepsNumbers("Under section 5 you must", "Mu kitundu kino olina")).toBe(false);
  });
});

describe("translateAnswerText", () => {
  it("translates every line and keeps the shape, so citations still line up", async () => {
    const { text, keptInEnglish } = await translateAnswerText(ANSWER, tag);
    expect(keptInEnglish).toBe(0);
    expect(text.lawSays).toHaveLength(2);
    expect(text.lawSays[0]).toBe(`LG ${ANSWER.lawSays[0]}`);
    expect(text.directAnswer.startsWith("LG ")).toBe(true);
    expect(text.clarifyingQuestions).toEqual([]);
  });

  it("keeps a line in English when a number does not survive", async () => {
    const dropsTwelve = async (s: string) => s.replace("12", "kkumi n'ebiri");
    const { text, keptInEnglish } = await translateAnswerText(ANSWER, dropsTwelve);
    expect(text.lawSays[1]).toBe(ANSWER.lawSays[1]);
    expect(keptInEnglish).toBe(1);
  });

  it("keeps a line in English when its call fails, and translates the rest", async () => {
    const flaky = async (s: string) => {
      if (s.startsWith("Section")) throw new Error("boom");
      return `LG ${s}`;
    };
    const { text, keptInEnglish } = await translateAnswerText(ANSWER, flaky);
    expect(text.lawSays[0]).toBe(ANSWER.lawSays[0]);
    expect(text.lawSays[1]).toBe(`LG ${ANSWER.lawSays[1]}`);
    expect(keptInEnglish).toBe(1);
  });

  it("throws when nothing could be translated, so the caller can say so", async () => {
    const down = async () => {
      throw new Error("down");
    };
    await expect(translateAnswerText(ANSWER, down)).rejects.toThrow("unavailable");
  });

  it("translates a repeated line once", async () => {
    const translate = jest.fn(tag);
    await translateAnswerText({ ...ANSWER, warnings: [ANSWER.uncertainty] }, translate);
    const calls = translate.mock.calls.map(([s]) => s);
    expect(calls.filter((s) => s === ANSWER.uncertainty)).toHaveLength(1);
  });

  it("never runs more calls at once than the limit", async () => {
    let active = 0;
    let peak = 0;
    const slow = async (s: string) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return s;
    };
    await translateAnswerText(ANSWER, slow, { concurrency: 2 });
    expect(peak).toBeLessThanOrEqual(2);
  });
});

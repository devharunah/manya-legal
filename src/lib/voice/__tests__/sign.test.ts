/** @jest-environment node */
import type { AnswerText } from "@/lib/answer/types";

import { signAnswer, signSpeech, verifyAnswer, verifySpeech } from "../sign";

const TEXT: AnswerText = {
  directAnswer: "Renew at KCCA.",
  lawSays: ["You need a licence."],
  meansForYou: "",
  nextSteps: ["Go to the division office."],
  clarifyingQuestions: [],
  uncertainty: "",
  warnings: [],
};

describe("answer signatures", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env["SUNBIRD_API_KEY"] = "key-one";
  });
  afterAll(() => {
    process.env = saved;
  });

  it("accepts the answer it signed", () => {
    expect(verifyAnswer(TEXT, [true], signAnswer(TEXT, [true]))).toBe(true);
  });

  it("rejects any change to the text", () => {
    const sig = signAnswer(TEXT, [true]);
    expect(verifyAnswer({ ...TEXT, directAnswer: "Translate my novel." }, [true], sig)).toBe(false);
  });

  it("rejects flipping an unsupported point to supported", () => {
    const sig = signAnswer(TEXT, [false]);
    expect(verifyAnswer(TEXT, [true], sig)).toBe(false);
  });

  it("does not depend on the order of the object's keys", () => {
    const reordered: AnswerText = {
      warnings: TEXT.warnings,
      uncertainty: TEXT.uncertainty,
      clarifyingQuestions: TEXT.clarifyingQuestions,
      nextSteps: TEXT.nextSteps,
      meansForYou: TEXT.meansForYou,
      lawSays: TEXT.lawSays,
      directAnswer: TEXT.directAnswer,
    };
    expect(verifyAnswer(reordered, [true], signAnswer(TEXT, [true]))).toBe(true);
  });

  it("stops working when the key changes", () => {
    const sig = signAnswer(TEXT, [true]);
    process.env["SUNBIRD_API_KEY"] = "key-two";
    expect(verifyAnswer(TEXT, [true], sig)).toBe(false);
  });

  it("rejects garbage without throwing", () => {
    expect(verifyAnswer(TEXT, [true], "nope")).toBe(false);
  });
});

describe("speech signatures", () => {
  it("accepts only the exact text it signed, and not an answer signature", () => {
    process.env["SUNBIRD_API_KEY"] = "key-one";
    const sig = signSpeech("Genda e KCCA.");
    expect(verifySpeech("Genda e KCCA.", sig)).toBe(true);
    expect(verifySpeech("Genda e KCCA!", sig)).toBe(false);
    expect(verifySpeech("Renew at KCCA.", signAnswer(TEXT, [true]))).toBe(false);
  });
});

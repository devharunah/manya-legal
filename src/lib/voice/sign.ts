import { createHmac, timingSafeEqual } from "node:crypto";

import type { AnswerText } from "@/lib/answer/types";
import { optionalEnv } from "@/lib/env";

/**
 * Stops /api/voice/* being an open proxy to a paid service. /api/ask signs
 * each answer it produces, /api/voice/answer signs each piece of speech it
 * makes, and the voice routes only work on text carrying a valid signature.
 * The key is derived from the speech key, so there is no extra secret to set.
 */
function key(): Buffer {
  const secret = optionalEnv("SUNBIRD_API_KEY", "") || "e2e-mock-voice";
  return createHmac("sha256", "manya-voice-signing-v1").update(secret).digest();
}

function mac(purpose: string, payload: unknown): string {
  return createHmac("sha256", key())
    .update(`${purpose}\n${JSON.stringify(payload)}`)
    .digest("base64url");
}

function check(purpose: string, payload: unknown, sig: string): boolean {
  const expected = Buffer.from(mac(purpose, payload));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** A fixed field order, so the signature doesn't depend on JSON key order. */
function canonical(text: AnswerText, supported: readonly boolean[]) {
  return [
    text.directAnswer,
    text.lawSays,
    text.meansForYou,
    text.nextSteps,
    text.clarifyingQuestions,
    text.uncertainty,
    text.warnings,
    supported,
  ];
}

export const signAnswer = (text: AnswerText, supported: readonly boolean[]) =>
  mac("answer", canonical(text, supported));

export const verifyAnswer = (text: AnswerText, supported: readonly boolean[], sig: string) =>
  check("answer", canonical(text, supported), sig);

export const signSpeech = (text: string) => mac("speech", text);

export const verifySpeech = (text: string, sig: string) => check("speech", text, sig);

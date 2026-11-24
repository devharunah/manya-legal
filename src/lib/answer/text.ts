import { z } from "zod";

import type { Answer, AnswerText } from "./types";

/** Pulls out the parts of an answer a trader reads, in display order. */
export function toAnswerText(answer: Answer): AnswerText {
  return {
    directAnswer: answer.directAnswer,
    lawSays: answer.lawSays.map((l) => l.point),
    meansForYou: answer.meansForYou,
    nextSteps: answer.nextSteps,
    clarifyingQuestions: answer.clarifyingQuestions,
    uncertainty: answer.uncertainty,
    warnings: answer.warnings,
  };
}

// Generous per field; the voice route also caps the total characters.
const line = z.string().max(2000);
const lines = z.array(line).max(20);

/** Bounds what a client may send for translation, so one request can't run up the bill. */
export const answerTextSchema = z.object({
  directAnswer: line,
  lawSays: lines,
  meansForYou: line,
  nextSteps: lines,
  clarifyingQuestions: lines,
  uncertainty: line,
  warnings: lines,
}) satisfies z.ZodType<AnswerText>;

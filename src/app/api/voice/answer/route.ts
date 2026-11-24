import { z } from "zod";

import { answerTextSchema } from "@/lib/answer/text";
import type { LugandaAnswer, SpeechPiece } from "@/lib/answer/types";
import { spokenAnswer } from "@/lib/audio/speech-text";
import { createRateLimiter } from "@/lib/rate-limit";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";
import { signSpeech, verifyAnswer } from "@/lib/voice/sign";
import { translateAnswerText } from "@/lib/voice/translate-answer";

export const maxDuration = 60;

// A long real answer is ~3,000 characters; this bounds one request's cost.
const MAX_CHARS = 8_000;

const bodySchema = z.object({
  answer: answerTextSchema,
  supported: z.array(z.boolean()).max(20),
  token: z.string().min(1).max(100),
});
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

const sign = (pieces: string[]): SpeechPiece[] =>
  pieces.map((text) => ({ text, sig: signSpeech(text) }));

/**
 * Translates an already-checked English answer into Luganda. Runs after
 * /api/ask, never instead of it, and only on an answer /api/ask signed: this
 * route can't be used to translate arbitrary text on our credits. A line that
 * changes a number stays in English.
 */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send an answer to translate." }, { status: 400 });
  }
  const { answer, supported, token } = parsed.data;
  if (!verifyAnswer(answer, supported, token)) {
    return Response.json({ error: "This answer can't be translated." }, { status: 403 });
  }
  const chars = JSON.stringify(answer).length;
  if (chars > MAX_CHARS) {
    return Response.json({ error: "This answer is too long to translate." }, { status: 413 });
  }

  const provider = getVoiceProvider();
  try {
    const { text, keptInEnglish } = await translateAnswerText(answer, (line) =>
      provider.translate(line, "lug", "eng"),
    );
    const speech = spokenAnswer(answer, text, supported);
    const result: LugandaAnswer = {
      text,
      keptInEnglish,
      speech: { all: sign(speech.all), steps: sign(speech.steps) },
    };
    return Response.json(result);
  } catch (error) {
    return serviceFailure("answer", error, "The Luganda version isn't available right now.");
  }
}

import { z } from "zod";

import { createRateLimiter } from "@/lib/rate-limit";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";

export const maxDuration = 30;

const bodySchema = z.object({ text: z.string().trim().min(3).max(500) });
// The one voice route that takes free text, so the tightest limit: short
// questions, a few a minute, enough for a trader and not for a bulk translator.
const allow = createRateLimiter({ limit: 8, windowMs: 60_000 });

/**
 * A question in Luganda (or English) to English, because our sources and the
 * refusal gate work in English. The source language is left for the service to
 * detect: English text comes back unchanged.
 */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send a question (3-500 characters)." }, { status: 400 });
  }
  try {
    const english = await getVoiceProvider().translate(parsed.data.text, "eng");
    return Response.json({ english });
  } catch (error) {
    return serviceFailure(
      "question",
      error,
      "We couldn't translate your question. Please try again.",
    );
  }
}

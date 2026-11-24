import { z } from "zod";

import { createRateLimiter } from "@/lib/rate-limit";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";
import { verifySpeech } from "@/lib/voice/sign";
import type { SpeechAudio } from "@/lib/voice/types";

export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string().min(1).max(600),
  sig: z.string().min(1).max(100),
});
// "Play all" fetches several short pieces at once.
const allow = createRateLimiter({ limit: 60, windowMs: 60_000 });

// Replaying the same sentence shouldn't spend credits twice. Per instance, small.
const cache = new Map<string, SpeechAudio>();
const CACHE_SIZE = 40;

function remember(text: string, speech: SpeechAudio) {
  if (cache.size >= CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(text, speech);
}

/** Luganda text to Luganda speech (WAV). */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send text to read (up to 600 characters)." }, { status: 400 });
  }
  const { text, sig } = parsed.data;
  // Only speech /api/voice/answer produced: no reading arbitrary text on our credits.
  if (!verifySpeech(text, sig)) {
    return Response.json({ error: "This text can't be read aloud." }, { status: 403 });
  }
  try {
    const speech = cache.get(text) ?? (await getVoiceProvider().synthesize(text));
    remember(text, speech);
    return new Response(speech.audio, {
      headers: { "content-type": speech.contentType, "cache-control": "private, max-age=3600" },
    });
  } catch (error) {
    return serviceFailure("speak", error, "We couldn't read this aloud right now.");
  }
}

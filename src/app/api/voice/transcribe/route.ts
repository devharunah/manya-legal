import { createRateLimiter } from "@/lib/rate-limit";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";

export const maxDuration = 60;

// The recorder sends 16 kHz mono WAV capped at 45 s (~1.44 MB).
const MAX_BYTES = 1_600_000;
const TYPES = new Set(["audio/wav", "audio/x-wav", "audio/wave"]);
// Live transcription re-sends the growing recording every few seconds.
const allow = createRateLimiter({ limit: 40, windowMs: 60_000 });

/**
 * Peak level of a 16-bit PCM WAV body, 0-1. Logged when a transcript comes
 * back empty, so a silent microphone can be told apart from an unclear voice.
 */
async function peakLevel(audio: Blob): Promise<number> {
  const view = new DataView(await audio.arrayBuffer());
  let peak = 0;
  for (let i = 44; i + 1 < view.byteLength; i += 2) {
    peak = Math.max(peak, Math.abs(view.getInt16(i, true)));
  }
  return peak / 0x8000;
}

/** Voice note in, text out (Luganda or English). Nothing is stored on our side. */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;

  const tooLong = () =>
    Response.json(
      { error: "That recording is too long. Keep it under 45 seconds." },
      { status: 413 },
    );
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return tooLong();
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const language = form?.get("language") === "eng" ? "eng" : "lug";
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Send a recording." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return tooLong();
  if (!TYPES.has(audio.type.split(";")[0] ?? "")) {
    return Response.json({ error: "Unsupported recording format." }, { status: 415 });
  }

  try {
    const text = await getVoiceProvider().transcribe(audio, language);
    if (!text) {
      console.warn("[voice:transcribe] empty transcript", {
        bytes: audio.size,
        seconds: Math.round(((audio.size - 44) / 32_000) * 10) / 10,
        peak: Math.round((await peakLevel(audio)) * 1000) / 1000,
        language,
      });
      return Response.json(
        { error: "We couldn't hear any words. Try again, a little closer to the phone." },
        { status: 422 },
      );
    }
    return Response.json({ text });
  } catch (error) {
    return serviceFailure(
      "transcribe",
      error,
      "We couldn't turn your voice into text. Please try again or type your question.",
    );
  }
}

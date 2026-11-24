import { createRateLimiter } from "@/lib/rate-limit";
import { guard, serviceFailure } from "@/lib/voice/http";
import { getVoiceProvider } from "@/lib/voice/provider";

export const maxDuration = 60;

// The recorder sends 16 kHz mono WAV capped at 30 s (~960 KB).
const MAX_BYTES = 1_500_000;
const TYPES = new Set(["audio/wav", "audio/x-wav", "audio/wave"]);
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

/** Luganda voice note in, Luganda text out. Nothing is stored on our side. */
export async function POST(req: Request) {
  const blocked = guard(req, allow);
  if (blocked) return blocked;

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return Response.json(
      { error: "That recording is too long. Keep it under 30 seconds." },
      { status: 413 },
    );
  }
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Send a recording." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json(
      { error: "That recording is too long. Keep it under 30 seconds." },
      { status: 413 },
    );
  }
  if (!TYPES.has(audio.type.split(";")[0] ?? "")) {
    return Response.json({ error: "Unsupported recording format." }, { status: 415 });
  }

  try {
    const text = await getVoiceProvider().transcribe(audio);
    if (!text) {
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

import { clientKey, type createRateLimiter } from "@/lib/rate-limit";

import { hasVoice, isMockVoice } from "./provider";
import { VoiceServiceError } from "./types";

/** Shared guard for every /api/voice route: configured, and not over the limit. */
export function guard(req: Request, allow: ReturnType<typeof createRateLimiter>): Response | null {
  if (!hasVoice()) {
    return Response.json({ error: "Voice is not available right now." }, { status: 503 });
  }
  // The fixture costs nothing, and parallel e2e runs share one address.
  if (!isMockVoice() && !allow(clientKey(req))) {
    return Response.json(
      { error: "Too many voice requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }
  return null;
}

/** Logs the real cause, returns a message that never echoes the upstream service. */
export function serviceFailure(route: string, error: unknown, message: string): Response {
  const detail =
    error instanceof VoiceServiceError
      ? `${error.message} (${error.status ?? "no status"})`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(`[voice:${route}]`, detail);
  return Response.json({ error: message }, { status: 502 });
}

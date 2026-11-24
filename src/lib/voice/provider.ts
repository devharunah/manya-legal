import { optionalEnv, requireEnv } from "@/lib/env";

import { createMockVoice } from "./mock";
import { createSunbird } from "./sunbird";
import type { VoiceProvider } from "./types";

/**
 * The e2e fixture. Ignored on a Vercel production deploy, so a stray
 * E2E_MOCK_VOICE can never serve fake transcripts to real traders.
 */
export const isMockVoice = () =>
  optionalEnv("E2E_MOCK_VOICE", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production";

/** Voice is offered only when a speech service is configured. */
export function hasVoice(): boolean {
  return isMockVoice() || optionalEnv("SUNBIRD_API_KEY", "") !== "";
}

/** Built per request, like the AI model, so builds run without a key. */
export function getVoiceProvider(): VoiceProvider {
  if (isMockVoice()) return createMockVoice();
  return createSunbird({
    apiKey: requireEnv("SUNBIRD_API_KEY"),
    voice: optionalEnv("SUNBIRD_TTS_VOICE", "Namuli"),
  });
}

import { encodeWav } from "@/lib/audio/wav";

import type { VoiceProvider } from "./types";

/** Luganda for "My trading licence is expiring. What should I do?" */
export const MOCK_TRANSCRIPT = "Layisinsi yange ey'okusuubula eggwaako. Nkole ki?";
export const MOCK_ENGLISH = "My trading licence is expiring. What should I do?";

/**
 * Stands in for the speech service in e2e tests (E2E_MOCK_VOICE), so the suite
 * runs without a key, without network and without spending credits.
 * "Translation" to Luganda tags the text and keeps every number, so the
 * number check passes exactly as it should for a faithful translation.
 */
export function createMockVoice(): VoiceProvider {
  return {
    name: "mock",
    transcribe: async () => MOCK_TRANSCRIPT,
    translate: async (text, to) =>
      to === "lug" ? `[Oluganda] ${text}` : text === MOCK_TRANSCRIPT ? MOCK_ENGLISH : text,
    synthesize: async () => ({
      audio: encodeWav(new Float32Array(2_400), 24_000),
      contentType: "audio/wav",
    }),
  };
}

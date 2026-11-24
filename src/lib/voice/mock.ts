import { encodeWav } from "@/lib/audio/wav";

import type { VoiceProvider } from "./types";

/**
 * Test fixture only, never shown to traders: an approximate Luganda account of
 * the PRD 13 demo scenario, and the English the fixture "translates" it to.
 */
export const MOCK_TRANSCRIPT =
  "Nasasula omusuubuzi ensimbi obukadde bubiri nga 10 November 2026, naye ebyamaguzi tebinnaleetebwa.";
export const MOCK_ENGLISH =
  "I paid the supplier 2 million shillings on 10 November 2026 for merchandise, but the goods have not been delivered.";

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

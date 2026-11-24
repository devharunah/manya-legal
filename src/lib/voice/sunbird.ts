import { z } from "zod";

import {
  type SpeechAudio,
  type VoiceLanguage,
  type VoiceProvider,
  VoiceServiceError,
} from "./types";

/**
 * Sunbird AI (https://docs.sunbird.ai): Luganda speech-to-text, translation and
 * text-to-speech behind one bearer token. Measured on the free tier, Nov 2026:
 * transcription ~11 s, translation ~5 s (parallel calls don't queue), speech
 * ~5 s for a short sentence and ~15 s for two long ones.
 */
export const SUNBIRD_URL = "https://api.sunbird.ai";

export interface SunbirdOptions {
  apiKey: string;
  voice: string;
  baseUrl?: string;
  /** Per-call limit. Speech gets longer: a cold Sunbird worker took 24 s for one short sentence. */
  timeoutMs?: number;
  speechTimeoutMs?: number;
  fetch?: typeof fetch;
  /** Waits before the single retry on 429; injectable so tests don't sleep. */
  sleep?: (ms: number) => Promise<void>;
}

const transcriptionSchema = z.object({ audio_transcription: z.string().nullable() });
const translationSchema = z.object({
  output: z.object({ translated_text: z.string().nullable() }).nullable(),
});

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createSunbird(options: SunbirdOptions): VoiceProvider {
  const {
    apiKey,
    voice,
    baseUrl = SUNBIRD_URL,
    timeoutMs = 45_000,
    speechTimeoutMs = 55_000,
    fetch: doFetch = fetch,
    sleep = wait,
  } = options;

  async function post(
    path: string,
    body: BodyInit,
    json: boolean,
    timeout = timeoutMs,
  ): Promise<Response> {
    const send = () =>
      doFetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          ...(json ? { "content-type": "application/json" } : {}),
        },
        body,
        signal: AbortSignal.timeout(timeout),
      });

    let res = await send();
    if (res.status === 429) {
      // One polite retry: the free tier is shared, and Sunbird asks for backoff.
      const after = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(after) && after > 0 ? Math.min(after * 1000, 3_000) : 1_000);
      res = await send();
    }
    if (!res.ok) throw new VoiceServiceError(`Sunbird ${path} failed`, res.status);
    return res;
  }

  return {
    name: "sunbird",

    async transcribe(audio, language = "lug") {
      const form = new FormData();
      form.append("audio", audio, "question.wav");
      // Auto-detect is unreliable per Sunbird's docs, so always name the language.
      form.append("language", language);
      const res = await post("/tasks/audio/transcriptions", form, false);
      const parsed = transcriptionSchema.safeParse(await res.json());
      if (!parsed.success) throw new VoiceServiceError("Unexpected transcription response");
      return (parsed.data.audio_transcription ?? "").trim();
    },

    async translate(text: string, to: VoiceLanguage, from?: VoiceLanguage) {
      const body = JSON.stringify({
        text,
        target_language: to,
        ...(from ? { source_language: from } : {}),
      });
      const res = await post("/tasks/translate", body, true);
      const parsed = translationSchema.safeParse(await res.json());
      const out = parsed.success ? parsed.data.output?.translated_text : null;
      if (!out) throw new VoiceServiceError("Unexpected translation response");
      return out.trim();
    },

    async synthesize(text): Promise<SpeechAudio> {
      const body = JSON.stringify({
        text,
        language: "lug",
        voice,
        // Bytes in the body: no signed URL to expire or leak to the browser.
        response_mode: "stream",
      });
      const res = await post("/tasks/audio/speech", body, true, speechTimeoutMs);
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("audio/")) {
        throw new VoiceServiceError("Speech response was not audio");
      }
      return { audio: await res.arrayBuffer(), contentType };
    },
  };
}

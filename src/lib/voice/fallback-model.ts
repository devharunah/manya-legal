import { generateText } from "ai";

import { getModels } from "@/lib/ai/model";

import { type VoiceLanguage, type VoiceProvider, VoiceServiceError } from "./types";

const NAMES: Record<VoiceLanguage, string> = { lug: "Luganda", eng: "English" };

/** Tries each configured model in turn; throws the last error if all fail. */
async function firstThat<T>(
  run: (model: ReturnType<typeof getModels>[number]["model"]) => Promise<T>,
): Promise<T> {
  let last: unknown = new VoiceServiceError("No AI model configured");
  for (const { id, model } of getModels()) {
    try {
      return await run(model);
    } catch (error) {
      last = error;
      console.error(
        `[voice:fallback] ${id} failed`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  throw last;
}

/**
 * Speech-to-text and translation through the general AI model, used only
 * when the speech service is down or over its daily quota, so a demo never
 * stops. Speech output (Luganda voices) has no fallback.
 */
export function createModelVoice(): Pick<VoiceProvider, "transcribe" | "translate"> {
  return {
    async transcribe(audio, language = "lug") {
      const bytes = new Uint8Array(await audio.arrayBuffer());
      const { text } = await firstThat((model) =>
        generateText({
          model,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(25_000),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Transcribe this voice note word for word. It is mostly ${NAMES[language]}, possibly mixed with English. Write numbers as digits. Return only the transcript, nothing else. If there is no speech, return an empty response.`,
                },
                { type: "file", data: bytes, mediaType: "audio/wav" },
              ],
            },
          ],
        }),
      );
      return text.trim();
    },

    async translate(text, to, from) {
      const source = from ? NAMES[from] : "the source language";
      const { text: out } = await firstThat((model) =>
        generateText({
          model,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(20_000),
          instructions: `Translate from ${source} to ${NAMES[to]}. Keep every number, amount, date and name exactly. Return only the translation.`,
          prompt: text,
        }),
      );
      return out.trim();
    },
  };
}

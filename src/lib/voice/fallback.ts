import type { VoiceProvider } from "./types";

type Backup = Pick<VoiceProvider, "transcribe" | "translate">;

/**
 * Wraps the speech service so transcription and translation fall back to the
 * AI model when it fails (including "daily quota exceeded").
 */
export function withFallback(
  primary: VoiceProvider,
  loadBackup: () => Promise<Backup>,
): VoiceProvider {
  return {
    name: `${primary.name}+fallback`,
    async transcribe(audio, language) {
      try {
        return await primary.transcribe(audio, language);
      } catch (error) {
        console.warn(
          "[voice] transcription falling back",
          error instanceof Error ? error.message : error,
        );
        return (await loadBackup()).transcribe(audio, language);
      }
    },
    async translate(text, to, from) {
      try {
        return await primary.translate(text, to, from);
      } catch (error) {
        console.warn(
          "[voice] translation falling back",
          error instanceof Error ? error.message : error,
        );
        return (await loadBackup()).translate(text, to, from);
      }
    },
    synthesize: (text) => primary.synthesize(text),
  };
}

/** ISO 639-3, the codes the African speech services use. */
export type VoiceLanguage = "lug" | "eng";

export interface SpeechAudio {
  audio: ArrayBuffer;
  contentType: string;
}

/**
 * Everything voice needs from a speech service. Sunbird implements it today;
 * Crane or another provider slots in behind the same shape.
 */
export interface VoiceProvider {
  readonly name: string;
  /** Luganda speech to Luganda text. */
  transcribe(audio: Blob): Promise<string>;
  /** Omit `from` to let the service detect it; text already in `to` comes back unchanged. */
  translate(text: string, to: VoiceLanguage, from?: VoiceLanguage): Promise<string>;
  /** Luganda text to speech. */
  synthesize(text: string): Promise<SpeechAudio>;
}

/** A failure talking to the speech service. The message is safe to log, never shown upstream text. */
export class VoiceServiceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VoiceServiceError";
  }
}

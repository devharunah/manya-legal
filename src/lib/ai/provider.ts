import { optionalEnv } from "@/lib/env";

export type Provider = "google" | "openai";

export const DEFAULT_MODELS: Record<Provider, string> = {
  google: "gemini-2.5-flash",
  openai: "gpt-5.4-mini",
};

export const KEY_VARS: Record<Provider, string> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

/**
 * AI_PROVIDER picks explicitly; otherwise use whichever key is configured,
 * preferring Gemini (it has a free tier). Null when no key is set.
 */
export function activeProvider(): Provider | null {
  const forced = process.env["AI_PROVIDER"];
  if (forced === "google" || forced === "openai") {
    return process.env[KEY_VARS[forced]] ? forced : null;
  }
  if (process.env[KEY_VARS.google]) return "google";
  if (process.env[KEY_VARS.openai]) return "openai";
  return null;
}

export function hasApiKey(): boolean {
  return activeProvider() !== null;
}

export function modelId(provider: Provider): string {
  return optionalEnv(
    provider === "google" ? "GEMINI_MODEL" : "OPENAI_MODEL",
    DEFAULT_MODELS[provider],
  );
}

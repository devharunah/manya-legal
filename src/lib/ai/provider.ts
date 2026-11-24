import { optionalEnv } from "@/lib/env";

export type Provider = "google" | "openai";

export const DEFAULT_MODELS: Record<Provider, string> = {
  google: "gemini-3.8-flash",
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

/** Lighter Gemini models to try, in order, when the primary is overloaded or unavailable. */
export const DEFAULT_GEMINI_FALLBACKS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];

/** The model ids to try for this request, primary first, without duplicates. */
export function modelChain(provider: Provider): string[] {
  const primary = modelId(provider);
  if (provider !== "google") return [primary];
  const fallbacks = optionalEnv("GEMINI_FALLBACK_MODELS", DEFAULT_GEMINI_FALLBACKS.join(","))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

/**
 * Every provider to try, active one first. The other provider is added as a
 * last resort when its key is set, so one free tier running out (Gemini's is
 * 20 requests a day per model) doesn't stop the app.
 */
export function providerChain(): Provider[] {
  const active = activeProvider();
  if (!active) return [];
  const other: Provider = active === "google" ? "openai" : "google";
  return process.env[KEY_VARS[other]] ? [active, other] : [active];
}

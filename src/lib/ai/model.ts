import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import { requireEnv } from "@/lib/env";

import { KEY_VARS, type Provider, modelChain, providerChain } from "./provider";

export { hasApiKey } from "./provider";

function modelsFor(provider: Provider) {
  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey: requireEnv(KEY_VARS.google) });
    return modelChain("google").map((id) => ({ id, model: google(id) }));
  }
  const openai = createOpenAI({ apiKey: requireEnv(KEY_VARS.openai) });
  return modelChain("openai").map((id) => ({ id, model: openai(id) }));
}

/**
 * The models to try for one request: the active provider's chain first, then
 * the other provider's if its key is set. Built per request, not at import
 * time, so `pnpm build` and the e2e suite run without a key.
 */
export function getModels() {
  return providerChain().flatMap(modelsFor);
}

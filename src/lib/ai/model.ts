import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import { requireEnv } from "@/lib/env";

import { KEY_VARS, activeProvider, modelChain } from "./provider";

export { hasApiKey } from "./provider";

/**
 * The models to try for one request, primary first. Built per request, not at
 * import time, so `pnpm build` and the e2e suite run without a key.
 */
export function getModels() {
  if (activeProvider() === "google") {
    const google = createGoogleGenerativeAI({ apiKey: requireEnv(KEY_VARS.google) });
    return modelChain("google").map((id) => ({ id, model: google(id) }));
  }
  const openai = createOpenAI({ apiKey: requireEnv(KEY_VARS.openai) });
  return modelChain("openai").map((id) => ({ id, model: openai(id) }));
}

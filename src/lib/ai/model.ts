import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import { requireEnv } from "@/lib/env";

import { KEY_VARS, activeProvider, modelId } from "./provider";

export { hasApiKey } from "./provider";

// Built per request, not at import time, so `pnpm build` and the e2e suite run without a key.
export function getModel() {
  if (activeProvider() === "google") {
    const google = createGoogleGenerativeAI({ apiKey: requireEnv(KEY_VARS.google) });
    return google(modelId("google"));
  }
  const openai = createOpenAI({ apiKey: requireEnv(KEY_VARS.openai) });
  return openai(modelId("openai"));
}

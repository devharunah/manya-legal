import { createTextStreamResponse, streamText, toTextStream } from "ai";

import { getModels, hasApiKey } from "@/lib/ai/model";
import { fail, withStore } from "@/lib/api";
import { optionalEnv } from "@/lib/env";
import { SUMMARY_INSTRUCTIONS, summaryFacts, templateSummary } from "@/lib/intake/summary";

export const maxDuration = 30;

const rulesOnly = () =>
  (optionalEnv("E2E_MOCK_LLM", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production") ||
  !hasApiKey();

/** Streams a fixed text word by word, so the no-AI path looks and behaves the same. */
function streamOf(text: string): ReadableStream<string> {
  const words = text.split(/(?<=\s)/);
  let i = 0;
  return new ReadableStream<string>({
    async pull(controller) {
      if (i >= words.length) {
        controller.close();
        return;
      }
      controller.enqueue(words[i++] as string);
      await new Promise((r) => setTimeout(r, 15));
    },
  });
}

/**
 * Streams a plain-language summary of what the trader reported (Vercel AI
 * SDK streamText). It reads only the case's own fields; the trader still
 * checks every detail on the review screen.
 */
export const POST = (_req: Request, ctx: RouteContext<"/api/cases/[id]/summary">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    if (!record.intake.narrative && Object.keys(record.intake.values).length === 0) {
      return fail("Tell MANYA what happened first.", 409);
    }

    const headers = { "cache-control": "no-store" };
    if (rulesOnly()) {
      return createTextStreamResponse({
        headers,
        stream: streamOf(templateSummary(record.intake)),
      });
    }
    const first = getModels()[0];
    if (!first) return fail("The AI service is not available right now.", 503);
    const result = streamText({
      model: first.model,
      instructions: SUMMARY_INSTRUCTIONS,
      prompt: summaryFacts(record.intake),
      maxRetries: 1,
      providerOptions: { openai: { reasoningEffort: "low" } },
      onError: ({ error }) =>
        console.error("[summary] stream failed", error instanceof Error ? error.message : error),
    });
    return createTextStreamResponse({ headers, stream: toTextStream({ stream: result.stream }) });
  });

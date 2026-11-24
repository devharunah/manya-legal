import { createTextStreamResponse, streamText } from "ai";

import { getModels, hasApiKey } from "@/lib/ai/model";
import { fail, withStore } from "@/lib/api";
import { optionalEnv } from "@/lib/env";
import type { Intake } from "@/lib/intake/fields";
import { SUMMARY_INSTRUCTIONS, summaryFacts, templateSummary } from "@/lib/intake/summary";

export const maxDuration = 30;

const rulesOnly = () =>
  (optionalEnv("E2E_MOCK_LLM", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production") ||
  !hasApiKey();

/** Streams a fixed text word by word, so the no-AI path looks and behaves the same. */
async function* words(text: string): AsyncGenerator<string> {
  for (const word of text.split(/(?<=\s)/)) {
    yield word;
    await new Promise((r) => setTimeout(r, 15));
  }
}

/**
 * Model text, falling through the model chain until one actually starts
 * streaming (a busy or out-of-quota model fails on its first chunk), and
 * finally the no-AI summary, so the trader never gets an empty box.
 */
async function* summaryText(intake: Intake): AsyncGenerator<string> {
  for (const { id, model } of getModels()) {
    let started = false;
    try {
      const result = streamText({
        model,
        instructions: SUMMARY_INSTRUCTIONS,
        prompt: summaryFacts(intake),
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(20_000),
        providerOptions: { openai: { reasoningEffort: "low" } },
      });
      for await (const delta of result.textStream) {
        started = true;
        yield delta;
      }
      if (started) return;
    } catch (error) {
      console.error(`[summary] ${id} failed`, error instanceof Error ? error.message : error);
      // Text already sent can't be taken back; stop rather than mix two summaries.
      if (started) return;
    }
  }
  yield* words(templateSummary(intake));
}

function toStream(source: AsyncGenerator<string>): ReadableStream<string> {
  return new ReadableStream<string>({
    async pull(controller) {
      const { value, done } = await source.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    async cancel() {
      await source.return(undefined);
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
    const stream = toStream(
      rulesOnly() ? words(templateSummary(record.intake)) : summaryText(record.intake),
    );
    return createTextStreamResponse({ headers: { "cache-control": "no-store" }, stream });
  });

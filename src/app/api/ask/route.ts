import { generateObject } from "ai";
import { z } from "zod";

import { getModels, hasApiKey } from "@/lib/ai/model";
import { refusal, sourcesOnly, validateModelAnswer } from "@/lib/answer/assemble";
import { INSTRUCTIONS, buildPrompt } from "@/lib/answer/prompt";
import { modelAnswerSchema } from "@/lib/answer/types";
import { retrieve } from "@/lib/kb/retrieve";
import { profileSchema } from "@/lib/profile";

export const maxDuration = 60;

// Each model gets one short attempt; together they stay well inside maxDuration,
// so a busy free tier degrades to the sources-only answer instead of a timeout.
const ATTEMPT_MS = 15_000;
const BUDGET_MS = 45_000;

const bodySchema = z.object({
  question: z.string().trim().min(3).max(500),
  profile: profileSchema,
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Send a question (3-500 characters) and a business profile." },
      { status: 400 },
    );
  }
  const { question, profile } = parsed.data;

  const retrieval = retrieve(question);
  if (!retrieval.covered) return Response.json(refusal());

  if (process.env["E2E_MOCK_LLM"] || !hasApiKey()) {
    return Response.json(sourcesOnly(retrieval.hits));
  }

  const prompt = buildPrompt(question, profile, retrieval.hits);
  const started = Date.now();
  for (const { id, model } of getModels()) {
    const remaining = BUDGET_MS - (Date.now() - started);
    if (remaining < 3_000) break;
    try {
      const { object } = await generateObject({
        model,
        schema: modelAnswerSchema,
        schemaName: "legal_answer",
        instructions: INSTRUCTIONS,
        prompt,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(Math.min(ATTEMPT_MS, remaining)),
      });
      return Response.json(validateModelAnswer(object, retrieval.hits));
    } catch (error) {
      console.error(`[ask] model ${id} failed`, error instanceof Error ? error.message : error);
    }
  }
  return Response.json(sourcesOnly(retrieval.hits));
}

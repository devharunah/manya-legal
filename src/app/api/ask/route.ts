import { generateObject } from "ai";
import { z } from "zod";

import { getModel, hasApiKey } from "@/lib/ai/model";
import { refusal, sourcesOnly, validateModelAnswer } from "@/lib/answer/assemble";
import { INSTRUCTIONS, buildPrompt } from "@/lib/answer/prompt";
import { modelAnswerSchema } from "@/lib/answer/types";
import { retrieve } from "@/lib/kb/retrieve";
import { profileSchema } from "@/lib/profile";

export const maxDuration = 60;

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

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: modelAnswerSchema,
      schemaName: "legal_answer",
      instructions: INSTRUCTIONS,
      prompt: buildPrompt(question, profile, retrieval.hits),
    });
    return Response.json(validateModelAnswer(object, retrieval.hits));
  } catch (error) {
    console.error("[ask] model call failed", error);
    return Response.json(sourcesOnly(retrieval.hits));
  }
}

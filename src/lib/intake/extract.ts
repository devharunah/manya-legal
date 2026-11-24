import { generateObject } from "ai";
import { z } from "zod";

import { getModels, hasApiKey } from "@/lib/ai/model";
import type { DisputeCategory } from "@/lib/cases/types";
import { optionalEnv } from "@/lib/env";
import { enT } from "@/lib/i18n/translate";

import {
  AGREEMENT_TYPES,
  DELIVERY_STATUSES,
  FIELDS,
  type FieldKey,
  RESOLUTIONS,
  YES_NO,
} from "./fields";
import { heuristicExtract } from "./heuristic";
import type { Extraction } from "./merge";

/** What the model may return. Keys use "__" for "."; every field is nullable. */
const schema = z.object({
  category: z.enum(["supplier_non_delivery", "other"]).nullable(),
  complainant__name: z.string().nullable(),
  complainant__business_name: z.string().nullable(),
  complainant__phone: z.string().nullable(),
  respondent__name: z.string().nullable(),
  respondent__phone: z.string().nullable(),
  transaction__date: z.string().nullable().describe("yyyy-mm-dd"),
  transaction__amount: z.number().nullable(),
  transaction__currency: z.string().nullable().describe("ISO 4217 code, e.g. UGX"),
  transaction__goods: z.string().nullable(),
  transaction__agreement_type: z.enum(AGREEMENT_TYPES).nullable(),
  delivery__expected_date: z.string().nullable().describe("yyyy-mm-dd"),
  delivery__status: z.enum(DELIVERY_STATUSES).nullable(),
  previous_communication: z.string().nullable(),
  requested_resolution: z.enum(RESOLUTIONS).nullable(),
  arbitration_agreement: z.enum(YES_NO).nullable(),
});

const INSTRUCTIONS = `You read one message from a small trader in Uganda who is reporting a dispute with a supplier, and fill in a form.
Rules:
- Record only what the trader explicitly states in THIS message. Use null for everything else.
- Never guess, infer, assume or complete missing details. A null is always better than a guess.
- The respondent is the supplier the trader paid. The complainant is the trader.
- Amounts: a plain number ("2 million" -> 2000000). Currency: ISO code; Ugandan shillings, "shs", "/=" -> UGX.
- Dates: yyyy-mm-dd. Resolve relative dates ("yesterday", "last Monday") from today's date; if the day can't be worked out, null.
- category: "supplier_non_delivery" if the trader paid for goods that were not (fully) delivered, "other" if it is clearly a different dispute, null if unclear.`;

const ATTEMPT_MS = 12_000;
const BUDGET_MS = 30_000;

export interface ExtractResult {
  extraction: Extraction;
  category: DisputeCategory | null;
  by: "model" | "rules";
}

const rulesOnly = () =>
  (optionalEnv("E2E_MOCK_LLM", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production") ||
  !hasApiKey();

/**
 * Extracts form fields from one English message. The model only reads;
 * merge.ts decides what is kept. Falls back to rules if every model fails.
 */
export async function extractFields(text: string, asked: FieldKey | null): Promise<ExtractResult> {
  if (rulesOnly()) return { ...heuristicExtract(text, asked), by: "rules" };

  const question = asked ? enT(`q.${asked}`) : "Tell me what happened with your supplier.";
  const prompt = `Today's date: ${new Date().toISOString().slice(0, 10)}
MANYA asked: "${question}"
Trader's message: """${text}"""`;

  const started = Date.now();
  const models = getModels();
  for (const [index, { id, model }] of models.entries()) {
    const remaining = BUDGET_MS - (Date.now() - started);
    if (remaining < 2_000) break;
    const isLast = index === models.length - 1;
    try {
      const { object } = await generateObject({
        model,
        schema,
        schemaName: "dispute_intake",
        instructions: INSTRUCTIONS,
        prompt,
        maxRetries: 0,
        providerOptions: { openai: { reasoningEffort: "low" } },
        abortSignal: AbortSignal.timeout(isLast ? remaining : Math.min(ATTEMPT_MS, remaining)),
      });
      const extraction: Extraction = {};
      for (const { key } of FIELDS) {
        const value = object[key.replace(".", "__") as keyof typeof object];
        if (value !== null && value !== undefined) extraction[key] = value;
      }
      return { extraction, category: object.category, by: "model" };
    } catch (error) {
      console.error(`[intake] model ${id} failed`, error instanceof Error ? error.message : error);
    }
  }
  return { ...heuristicExtract(text, asked), by: "rules" };
}

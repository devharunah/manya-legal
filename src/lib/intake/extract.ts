import { generateObject } from "ai";
import { z } from "zod";

import { getModels, hasApiKey } from "@/lib/ai/model";
import type { DisputeCategory } from "@/lib/cases/types";
import { optionalEnv } from "@/lib/env";
import { enT } from "@/lib/i18n/translate";

import type { ExtractContext } from "./engine";
import {
  AGREEMENT_TYPES,
  DELIVERY_STATUSES,
  DISPUTE_STATUSES,
  FIELDS,
  PAYMENT_METHODS,
  RESOLUTIONS,
  YES_NO,
} from "./fields";
import { heuristicExtract } from "./heuristic";
import type { Extraction } from "./merge";

/** What the model may return. Keys use "__" for "."; every field is nullable. */
const schema = z.object({
  category: z.enum(["supplier_non_delivery", "other"]).nullable(),
  dispute_status: z.enum(DISPUTE_STATUSES).nullable(),
  transaction__agreement_type: z.enum(AGREEMENT_TYPES).nullable(),
  agreement_record: z.enum(YES_NO).nullable(),
  arbitration_agreement: z.enum(YES_NO).nullable(),
  mediation_clause: z.enum(YES_NO).nullable(),
  separate_arbitration_agreement: z.enum(YES_NO).nullable(),
  complainant__name: z.string().nullable(),
  complainant__business_name: z.string().nullable(),
  complainant__phone: z.string().nullable(),
  complainant__email: z.string().nullable(),
  complainant__location: z.string().nullable(),
  respondent__name: z.string().nullable(),
  respondent__business_name: z.string().nullable(),
  respondent__phone: z.string().nullable(),
  respondent__location: z.string().nullable(),
  transaction__date: z.string().nullable().describe("yyyy-mm-dd"),
  transaction__amount: z.number().nullable(),
  transaction__currency: z.string().nullable().describe("ISO 4217 code, e.g. UGX"),
  transaction__payment_method: z.enum(PAYMENT_METHODS).nullable(),
  transaction__goods: z.string().nullable(),
  delivery__expected_date: z.string().nullable().describe("yyyy-mm-dd"),
  delivery__status: z.enum(DELIVERY_STATUSES).nullable(),
  previous_communication: z.string().nullable(),
  requested_resolution: z.enum(RESOLUTIONS).nullable(),
  evidence_available: z.string().nullable().describe("records the trader says they have"),
  events: z
    .array(z.object({ date: z.string().nullable().describe("yyyy-mm-dd"), text: z.string() }))
    .describe("dated steps the trader describes in THIS message, oldest first"),
});

export const INTAKE_INSTRUCTIONS = `You help MANYA, a dispute-preparation assistant for small traders in Uganda, read one message from a trader and fill in a structured form.

MANYA's conversation has six stages, run by the application (you do not choose questions):
1. Understand the dispute. 2. The agreement and any dispute-resolution arrangements. 3. The parties and transaction details.
4. What happened after payment and what has been done. 5. The outcome wanted and supporting records. 6. Review.

Rules:
- Record only what the trader states in THIS message. Use null for everything else. Never guess, infer or complete details.
- Facts are the trader's account, not established truth.
- The respondent is the supplier or other party; the complainant is the trader.
- Amounts: a plain number ("2 million" -> 2000000). Currency: ISO code; Uganda shillings, "shs", "/=" -> UGX. Only use another currency if the trader names it.
- Dates: yyyy-mm-dd, resolving relative dates from today's date; if the day cannot be worked out, null.
- Agreement: transaction__agreement_type is how the deal was made: "written" (a signed contract), "invoice", "whatsapp", "sms", "verbal" or "other".
  agreement_record = "yes" if the trader says a document or messages record the deal (contract, invoice, WhatsApp/SMS).
- Dispute-resolution clauses. Do not confuse them:
  arbitration_agreement: does the agreement say disputes go to an ARBITRATOR or to arbitration? (a private decision-maker)
  mediation_clause: does it say disputes go first to a MEDIATOR who helps both sides agree?
  separate_arbitration_agreement: a separate written agreement to arbitrate, outside the main deal.
  Answer "yes" only if the trader says such a term exists, "no" only if the trader says it does not or that the agreement says nothing about it, "unsure" if the trader says they don't know. Otherwise null.
  NEVER infer "no" just because there was no signed contract: WhatsApp messages or an invoice can still record the deal.
- category: "supplier_non_delivery" if the trader paid for goods or services not (fully) delivered; "other" if clearly a different dispute; null if unclear.
- events: short descriptions of what happened, with dates only when the trader gives them.`;

const ATTEMPT_MS = 12_000;
const BUDGET_MS = 30_000;

export interface ExtractResult {
  extraction: Extraction;
  category: DisputeCategory | null;
  events?: { date: string | null; text: string }[];
  by: "model" | "rules" | "script";
}

const rulesOnly = () =>
  (optionalEnv("E2E_MOCK_LLM", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production") ||
  !hasApiKey();

function contextPrompt(text: string, ctx: ExtractContext): string {
  const known = Object.entries(ctx.known)
    .map(([k, v]) => `- ${enT(`field.${k}` as Parameters<typeof enT>[0])}: ${v}`)
    .join("\n");
  const asking = ctx.asking.map((k) => enT(`field.${k}` as Parameters<typeof enT>[0])).join(", ");
  return `Today's date: ${new Date().toISOString().slice(0, 10)}
Current stage: ${ctx.stage ?? "1 (the trader's opening account)"}
MANYA asked: ${ctx.question ? `"${ctx.question}"` : "Tell me what happened with your business transaction."}
${asking ? `The question was about: ${asking}` : ""}
Already known (do not repeat unless the trader corrects it):
${known || "- nothing yet"}

Trader's message: """${text}"""`;
}

/**
 * Extracts form fields from one English message. The model only reads;
 * merge.ts decides what is kept. Falls back to rules if every model fails.
 */
export async function extractFields(text: string, ctx: ExtractContext): Promise<ExtractResult> {
  if (rulesOnly()) return { ...heuristicExtract(text, ctx.asking), by: "rules" };

  const prompt = contextPrompt(text, ctx);
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
        instructions: INTAKE_INSTRUCTIONS,
        prompt,
        maxRetries: 0,
        providerOptions: { openai: { reasoningEffort: "low" } },
        abortSignal: AbortSignal.timeout(isLast ? remaining : Math.min(ATTEMPT_MS, remaining)),
      });
      const extraction: Extraction = {};
      for (const { key } of FIELDS) {
        const value = object[key.replace(".", "__") as keyof typeof object];
        if (value !== null && value !== undefined && !Array.isArray(value)) extraction[key] = value;
      }
      return { extraction, category: object.category, events: object.events, by: "model" };
    } catch (error) {
      console.error(`[intake] model ${id} failed`, error instanceof Error ? error.message : error);
    }
  }
  return { ...heuristicExtract(text, ctx.asking), by: "rules" };
}

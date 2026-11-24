import { generateObject } from "ai";
import { z } from "zod";

import { getModels, hasApiKey } from "@/lib/ai/model";
import { DOCUMENT_CATEGORIES } from "@/lib/cases/types";
import { optionalEnv } from "@/lib/env";

import { type DocumentReading, readFromFilename } from "./filename";
import type { EvidenceMime } from "./upload";

export type { DocumentReading } from "./filename";

/** Below this confidence the category is reported as "unknown" (PRD 5.5). */
export const MIN_CONFIDENCE = 0.6;

const schema = z.object({
  category: z.enum(DOCUMENT_CATEGORIES),
  confidence: z.number().min(0).max(1),
  documentType: z
    .string()
    .nullable()
    .describe("e.g. MTN Mobile Money receipt, invoice, WhatsApp chat"),
  date: z.string().nullable().describe("yyyy-mm-dd of the transaction or document"),
  amount: z.number().nullable(),
  currency: z.string().nullable().describe("ISO 4217, e.g. UGX"),
  reference: z.string().nullable().describe("transaction ID or invoice number"),
  sender: z.string().nullable(),
  recipient: z.string().nullable(),
  description: z.string().nullable().describe("one short sentence, what the document shows"),
});

const INSTRUCTIONS = `You read one document a Ugandan trader uploaded as evidence in a dispute with a supplier.
Classify it and copy out the details exactly as printed. Rules:
- Use null for anything not clearly visible. Never guess or complete partial values.
- category: payment_evidence (Mobile Money / bank receipts), transaction_evidence (invoices, purchase orders),
  communication_evidence (WhatsApp or other messages), delivery_evidence (delivery notes), agreement (contracts),
  business_record (licences, registration), other, or unknown if you can't tell.
- confidence: how sure you are of the category, 0 to 1.
- amount: a plain number. currency: ISO code (UGX for Uganda shillings).
- You are not judging whether the document is genuine.`;

const rulesOnly = () =>
  (optionalEnv("E2E_MOCK_LLM", "") !== "" && optionalEnv("VERCEL_ENV", "") !== "production") ||
  !hasApiKey();

/** Classifies and reads one uploaded document. Never throws; a failure is "unknown". */
export async function readDocument(
  bytes: Uint8Array,
  mime: EvidenceMime,
  filename: string,
): Promise<DocumentReading> {
  if (rulesOnly()) return readFromFilename(filename);

  const file =
    mime === "application/pdf"
      ? ({ type: "file", data: bytes, mediaType: mime, filename } as const)
      : ({ type: "image", image: bytes, mediaType: mime } as const);
  for (const { id, model } of getModels()) {
    try {
      const { object } = await generateObject({
        model,
        schema,
        schemaName: "evidence_document",
        instructions: INSTRUCTIONS,
        messages: [
          { role: "user", content: [{ type: "text", text: `File name: ${filename}` }, file] },
        ],
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(25_000),
      });
      const { category, confidence, ...extraction } = object;
      return {
        category: confidence < MIN_CONFIDENCE ? "unknown" : category,
        confidence,
        extraction,
        ok: true,
      };
    } catch (error) {
      console.error(
        `[evidence] model ${id} failed`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  // Every model failed: classify from the file name only, and say the contents were not read,
  // so the trader is asked to enter the details rather than shown an empty card.
  const byName = readFromFilename(filename);
  return { category: byName.category, confidence: null, extraction: null, ok: false };
}

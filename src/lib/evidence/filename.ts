import type { DocumentCategory, DocumentExtraction } from "@/lib/cases/types";
import { amountsIn } from "@/lib/intake/ground";
import { datesIn } from "@/lib/intake/heuristic";

export interface DocumentReading {
  category: DocumentCategory;
  confidence: number | null;
  extraction: DocumentExtraction | null;
  ok: boolean;
}

export const EMPTY: DocumentExtraction = {
  documentType: null,
  date: null,
  amount: null,
  currency: null,
  reference: null,
  sender: null,
  recipient: null,
  description: null,
};

/**
 * Test and no-AI fallback: reads only the file name ("momo-receipt-1500000-2026-11-10.png").
 * Real documents need the model; without it the trader enters the details.
 */
export function readFromFilename(filename: string): DocumentReading {
  const lower = filename.toLowerCase();
  const category: DocumentCategory = /receipt|momo|mobile.?money|payment/.test(lower)
    ? "payment_evidence"
    : /invoice|order/.test(lower)
      ? "transaction_evidence"
      : /whatsapp|chat/.test(lower)
        ? "communication_evidence"
        : "unknown";
  const amount = amountsIn(lower.replace(/[-_]/g, " ")).find((n) => n >= 1_000) ?? null;
  const date = datesIn(lower.replace(/_/g, "-"))[0] ?? null;
  return {
    category,
    confidence: category === "unknown" ? 0 : 0.9,
    extraction: { ...EMPTY, amount, currency: amount ? "UGX" : null, date },
    ok: true,
  };
}


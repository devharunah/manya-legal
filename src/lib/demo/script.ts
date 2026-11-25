import type { ExtractResult } from "@/lib/intake/extract";
import type { QuestionKey } from "@/lib/intake/progress";

/**
 * The live stage demo: one prepared answer for every question MANYA can ask,
 * with the reading of that answer already worked out. A presenter taps the
 * suggested answer and sends it; because the reading is prepared, the turn
 * needs no AI call and cannot stall, refuse or ask for a retry. Anything the
 * presenter edits or types instead goes through the normal AI reading.
 *
 * The story and every detail in it are fictional, and match the SAMPLE files
 * in public/demo, so uploading them live raises no false mismatch.
 * Every value appears in its own answer text, so grounding keeps it.
 */
export type ScriptKey = "opening" | QuestionKey;

export interface ScriptTurn {
  text: string;
  reading: ExtractResult;
}

const turn = (
  text: string,
  extraction: ExtractResult["extraction"],
  events: { date: string | null; text: string }[] = [],
): ScriptTurn => ({
  text,
  reading: { extraction, category: "supplier_non_delivery", events, by: "script" },
});

const NO_CLAUSES = {
  arbitration_agreement: "no",
  mediation_clause: "no",
  separate_arbitration_agreement: "no",
} as const;

export const LIVE_SCRIPT: Record<ScriptKey, ScriptTurn> = {
  opening: turn(
    "I paid Daniel Okello of Okello Wholesale Supplies UGX 2,000,000 by mobile money on 10 November 2026 for household merchandise. He promised delivery by 12 November 2026 but no goods have been delivered.",
    {
      dispute_status: "ongoing",
      "respondent.name": "Daniel Okello",
      "respondent.business_name": "Okello Wholesale Supplies",
      "transaction.amount": 2_000_000,
      "transaction.currency": "UGX",
      "transaction.payment_method": "mobile_money",
      "transaction.date": "2026-11-10",
      "transaction.goods": "Household merchandise",
      "delivery.expected_date": "2026-11-12",
      "delivery.status": "not_delivered",
    },
    [
      { date: "2026-11-10", text: "Trader pays UGX 2,000,000 by mobile money" },
      { date: "2026-11-12", text: "Promised delivery date passes; no goods delivered" },
    ],
  ),
  "ask.agreement": turn(
    "We did not sign a formal contract. We agreed on WhatsApp and he sent me an invoice. There is nothing about arbitration or mediation in it, and no separate arbitration agreement.",
    { "transaction.agreement_type": "whatsapp", agreement_record: "yes", ...NO_CLAUSES },
  ),
  "ask.agreementClauses": turn(
    "There is nothing about arbitration or mediation in our WhatsApp messages or the invoice, and no separate arbitration agreement.",
    NO_CLAUSES,
  ),
  "ask.parties": turn("His number is +256 700 000 202.", {
    "respondent.phone": "+256 700 000 202",
  }),
  "ask.partiesBoth": turn(
    "I am Sarah Namusoke of Sarah's Home Essentials, phone +256 700 000 101. The supplier is Daniel Okello of Okello Wholesale Supplies, phone +256 700 000 202.",
    {
      "complainant.name": "Sarah Namusoke",
      "complainant.business_name": "Sarah's Home Essentials",
      "complainant.phone": "+256 700 000 101",
      "respondent.name": "Daniel Okello",
      "respondent.business_name": "Okello Wholesale Supplies",
      "respondent.phone": "+256 700 000 202",
    },
  ),
  "ask.transaction": turn(
    "I paid UGX 2,000,000 by mobile money on 10 November 2026 for household merchandise. Delivery was due on 12 November 2026.",
    {
      "transaction.amount": 2_000_000,
      "transaction.currency": "UGX",
      "transaction.payment_method": "mobile_money",
      "transaction.date": "2026-11-10",
      "transaction.goods": "Household merchandise",
      "delivery.expected_date": "2026-11-12",
    },
  ),
  "ask.events": turn(
    "No goods have been delivered. He confirmed the payment on 11 November 2026. On 14 November 2026 I messaged him and he said there was a delay with transport. On 18 November 2026 I followed up again and he only said he would update me.",
    {
      "delivery.status": "not_delivered",
      previous_communication:
        "Messaged the supplier on 14 November 2026 (he said transport was delayed) and again on 18 November 2026 (he said he would update me).",
    },
    [
      { date: "2026-11-11", text: "Supplier confirms receipt of payment" },
      { date: "2026-11-14", text: "Trader messages the supplier; he says transport is delayed" },
      { date: "2026-11-18", text: "Trader follows up again; he says he will update her" },
    ],
  ),
  "ask.outcome": turn(
    "I want the merchandise delivered or a refund of my money. I have the mobile money confirmation, the invoice, the WhatsApp chat and my written statement.",
    {
      requested_resolution: "delivery_or_refund",
      evidence_available:
        "Mobile money confirmation, invoice, WhatsApp conversation and a written statement.",
    },
  ),
  "ask.evidence": turn(
    "I have the mobile money confirmation, the invoice, the WhatsApp chat and my written statement.",
    {
      evidence_available:
        "Mobile money confirmation, invoice, WhatsApp conversation and a written statement.",
    },
  ),
  "ask.clarify": turn(
    "The supplier is Daniel Okello. I paid UGX 2,000,000 for household merchandise and no goods have been delivered. Nothing in our agreement mentions arbitration or mediation. I want the merchandise delivered or a refund.",
    {
      "respondent.name": "Daniel Okello",
      "transaction.amount": 2_000_000,
      "transaction.goods": "Household merchandise",
      "delivery.status": "not_delivered",
      arbitration_agreement: "no",
      mediation_clause: "no",
      requested_resolution: "delivery_or_refund",
    },
  ),
};

/** Case, spacing, curly quotes and final punctuation don't count as an edit. */
export const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?\s]+$/, "");

const BY_TEXT = new Map(Object.values(LIVE_SCRIPT).map((t) => [normalise(t.text), t.reading]));

/** The prepared reading of a script answer, or null if the text isn't one (or was edited). */
export function scriptedExtract(text: string): ExtractResult | null {
  return BY_TEXT.get(normalise(text)) ?? null;
}

/** The suggested answer for MANYA's last line: "opening" before anything is said. */
export function suggestedAnswer(lastManyaKey: string | null, hasMessages: boolean): string | null {
  if (!hasMessages) return LIVE_SCRIPT.opening.text;
  if (lastManyaKey && lastManyaKey in LIVE_SCRIPT && lastManyaKey !== "opening")
    return LIVE_SCRIPT[lastManyaKey as ScriptKey].text;
  return null;
}

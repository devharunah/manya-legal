import type { DocumentCategory, DocumentExtraction, Profile } from "@/lib/cases/types";
import type { FieldKey, Stage, TimelineEvent } from "@/lib/intake/fields";
import type { QuestionKey } from "@/lib/intake/progress";

/**
 * Stage demo data. EVERY name, phone number, email, business, transaction
 * and document here is fictional test data, and every evidence file is
 * watermarked SAMPLE. Files live in public/demo, so a presenter can also
 * download them and upload them live.
 */

export const DEMO_PROFILE: Profile = {
  fullName: "Sarah Namusoke",
  phone: "+256 700 000 101",
  preferredLanguage: "en",
  businessName: "Sarah's Home Essentials",
  businessType: "general_retail",
  location: "Kikuubo, Kampala",
};

export interface DemoDocument {
  file: string;
  mimeType: "image/png" | "application/pdf";
  category: DocumentCategory;
  extraction: DocumentExtraction;
}

export type DemoTurn =
  | { trader: string }
  | { ask: QuestionKey; stage: Stage; fields: FieldKey[] }
  | { say: string };

export interface DemoCase {
  /** Recognises an already-loaded demo case, so loading twice adds nothing. */
  key: string;
  narrative: string;
  values: Partial<Record<FieldKey, string | number>>;
  events: TimelineEvent[];
  /** The conversation as it happened, in the six-stage flow. */
  turns: DemoTurn[];
  documents: DemoDocument[];
  /** "report": confirmed with a PDF, ready for Resolve. "review": waiting for the trader to confirm. */
  stage: "report" | "review";
}

const doc = (extraction: Partial<DocumentExtraction>): DocumentExtraction => ({
  documentType: null,
  date: null,
  amount: null,
  currency: null,
  reference: null,
  sender: null,
  recipient: null,
  description: null,
  ...extraction,
});

const NARRATIVE =
  "I paid Daniel Okello of Okello Wholesale Supplies UGX 2,000,000 by mobile money on 10 November 2026 for household merchandise. He promised delivery by 12 November 2026 but no goods have been delivered.";

/** Fictional demo case: Supplier Non-Delivery After Payment. */
export const PRIMARY_DEMO: DemoCase = {
  key: "Daniel Okello",
  stage: "report",
  narrative: NARRATIVE,
  values: {
    dispute_status: "ongoing",
    "transaction.agreement_type": "whatsapp",
    agreement_record: "yes",
    arbitration_agreement: "no",
    mediation_clause: "no",
    separate_arbitration_agreement: "no",
    "complainant.name": "Sarah Namusoke",
    "complainant.business_name": "Sarah's Home Essentials",
    "complainant.phone": "+256 700 000 101",
    "complainant.email": "sarah.sample@example.com",
    "complainant.location": "Kikuubo, Kampala",
    "respondent.name": "Daniel Okello",
    "respondent.business_name": "Okello Wholesale Supplies",
    "respondent.phone": "+256 700 000 202",
    "transaction.date": "2026-11-10",
    "transaction.amount": 2_000_000,
    "transaction.currency": "UGX",
    "transaction.payment_method": "mobile_money",
    "transaction.goods": "Household merchandise",
    "delivery.expected_date": "2026-11-12",
    "delivery.status": "not_delivered",
    previous_communication:
      "Messaged the supplier on 14 November 2026 (he said transport was delayed) and again on 18 November 2026 (he said he would update me). No goods delivered.",
    requested_resolution: "delivery_or_refund",
    evidence_available:
      "Mobile money confirmation, invoice, WhatsApp conversation and a written statement.",
  },
  events: [
    {
      date: "2026-11-10",
      text: "Trader agrees to buy household merchandise from the supplier",
      source: "trader",
    },
    {
      date: "2026-11-10",
      text: "Trader transfers UGX 2,000,000 by mobile money",
      source: "trader",
    },
    { date: "2026-11-11", text: "Supplier confirms receipt of payment", source: "trader" },
    {
      date: "2026-11-12",
      text: "Expected delivery date passes without delivery",
      source: "trader",
    },
    {
      date: "2026-11-14",
      text: "Trader contacts the supplier asking about the goods",
      source: "trader",
    },
    { date: "2026-11-15", text: "Supplier responds that delivery is delayed", source: "trader" },
    {
      date: "2026-11-18",
      text: "Trader follows up again; no goods have been delivered",
      source: "trader",
    },
  ],
  turns: [
    { trader: NARRATIVE },
    { say: "intake.understood" },
    {
      ask: "ask.agreement",
      stage: "agreement",
      fields: [
        "transaction.agreement_type",
        "agreement_record",
        "arbitration_agreement",
        "mediation_clause",
        "separate_arbitration_agreement",
      ],
    },
    {
      trader:
        "We did not sign a formal contract. We agreed on WhatsApp and he sent me an invoice. There is nothing about arbitration or mediation in it, and no separate arbitration agreement.",
    },
    { ask: "ask.parties", stage: "parties", fields: ["respondent.phone"] },
    { trader: "His number is +256 700 000 202." },
    { ask: "ask.events", stage: "events", fields: ["previous_communication"] },
    {
      trader:
        "He confirmed the payment on 11 November. On 14 November I messaged him and he said there was a delay with transport. On 18 November I followed up again and he only said he would update me.",
    },
    {
      ask: "ask.outcome",
      stage: "outcome",
      fields: ["requested_resolution", "evidence_available"],
    },
    {
      trader:
        "I want the merchandise delivered or a refund of my money. I have the mobile money confirmation, the invoice, the WhatsApp chat and my written statement.",
    },
    { say: "intake.done" },
  ],
  documents: [
    {
      file: "SAMPLE_mobile_money_payment_confirmation.pdf",
      mimeType: "application/pdf",
      category: "payment_evidence",
      extraction: doc({
        documentType: "Mobile money transaction confirmation (SAMPLE)",
        date: "2026-11-10",
        amount: 2_000_000,
        currency: "UGX",
        reference: "SAMPLE-TXN-20261110-001",
        sender: "Sarah Namusoke",
        recipient: "Daniel Okello",
        description: "Successful payment of UGX 2,000,000 for household merchandise.",
      }),
    },
    {
      file: "SAMPLE_commercial_invoice.pdf",
      mimeType: "application/pdf",
      category: "transaction_evidence",
      extraction: doc({
        documentType: "Commercial invoice SAMPLE-INV-2026-011",
        date: "2026-11-10",
        amount: 2_000_000,
        currency: "UGX",
        reference: "SAMPLE-INV-2026-011",
        sender: "Okello Wholesale Supplies",
        recipient: "Sarah's Home Essentials",
        description:
          "Storage containers, kitchen utensils and cleaning accessories; marked paid; delivery 12 November 2026.",
      }),
    },
    {
      file: "SAMPLE_whatsapp_supplier_conversation.png",
      mimeType: "image/png",
      category: "communication_evidence",
      extraction: doc({
        documentType: "WhatsApp conversation with the supplier (SAMPLE)",
        date: "2026-11-10",
        amount: 2_000_000,
        currency: "UGX",
        sender: "Daniel Okello",
        description:
          "Agrees the UGX 2,000,000 total and delivery by Thursday, confirms payment, then reports a delay.",
      }),
    },
    {
      file: "SAMPLE_trader_statement.pdf",
      mimeType: "application/pdf",
      category: "other",
      extraction: doc({
        documentType: "Trader's written statement (fictional)",
        date: "2026-11-19",
        amount: 2_000_000,
        currency: "UGX",
        sender: "Sarah Namusoke",
        description:
          "First-person account of the agreement, payment, missed delivery, follow-ups and the outcome wanted.",
      }),
    },
  ],
};

/** A second fictional case for showing the inconsistency check: the receipt shows less than reported. */
export const INCONSISTENCY_DEMO: DemoCase = {
  key: "Brian Ssemanda",
  stage: "review",
  narrative:
    "I paid Brian Ssemanda UGX 2,000,000 on 12 November 2026 for 60 cartons of bar soap. He was to deliver within a week but has only made excuses.",
  values: {
    "transaction.agreement_type": "verbal",
    arbitration_agreement: "unsure",
    mediation_clause: "unsure",
    "complainant.name": "Sarah Namusoke",
    "complainant.business_name": "Sarah's Home Essentials",
    "complainant.phone": "+256 700 000 101",
    "respondent.name": "Brian Ssemanda",
    "respondent.phone": "+256 700 000 303",
    "transaction.date": "2026-11-12",
    "transaction.amount": 2_000_000,
    "transaction.currency": "UGX",
    "transaction.payment_method": "mobile_money",
    "transaction.goods": "60 cartons of bar soap",
    "delivery.status": "not_delivered",
    requested_resolution: "delivery",
  },
  events: [
    {
      date: "2026-11-12",
      text: "Trader pays the supplier for 60 cartons of bar soap",
      source: "trader",
    },
  ],
  turns: [
    {
      trader:
        "I paid Brian Ssemanda UGX 2,000,000 on 12 November 2026 for 60 cartons of bar soap. He was to deliver within a week but has only made excuses.",
    },
    { say: "intake.understood" },
    {
      ask: "ask.agreement",
      stage: "agreement",
      fields: [
        "transaction.agreement_type",
        "agreement_record",
        "arbitration_agreement",
        "mediation_clause",
        "separate_arbitration_agreement",
      ],
    },
    { trader: "We agreed by mouth at his shop. I'm not sure about arbitration or mediation." },
  ],
  documents: [
    {
      file: "SAMPLE_inconsistency_receipt.png",
      mimeType: "image/png",
      category: "payment_evidence",
      extraction: doc({
        documentType: "Mobile money transaction confirmation (SAMPLE)",
        date: "2026-11-12",
        amount: 1_500_000,
        currency: "UGX",
        reference: "SAMPLE-TXN-20261112-002",
        sender: "Sarah Namusoke",
        recipient: "Brian Ssemanda",
        description: "Payment of UGX 1,500,000 for soap cartons.",
      }),
    },
  ],
};

export const DEMO_CASES: DemoCase[] = [PRIMARY_DEMO, INCONSISTENCY_DEMO];

/** The files a presenter can download and upload live. */
export const DEMO_FILES = PRIMARY_DEMO.documents.map((d) => d.file);

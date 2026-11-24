import type { DocumentCategory, DocumentExtraction, Profile } from "@/lib/cases/types";
import type { FieldKey } from "@/lib/intake/fields";

/**
 * Stage demo data: a fictional Kikuubo trader and two cases, so a pitch can
 * show the whole journey without answering every question live. Every
 * evidence file is watermarked "SAMPLE – for demonstration only", and every
 * person and business here is invented.
 */

export const DEMO_PROFILE: Profile = {
  fullName: "Nakato Sarah",
  phone: "0772 123456",
  preferredLanguage: "en",
  businessName: "Nakato General Store",
  businessType: "general_retail",
  location: "Kikuubo, Kampala",
};

export interface DemoDocument {
  file: string;
  mimeType: "image/png" | "application/pdf";
  category: DocumentCategory;
  extraction: DocumentExtraction;
}

export interface DemoCase {
  /** Recognises an already-loaded demo case, so loading twice adds nothing. */
  key: string;
  narrative: string;
  values: Partial<Record<FieldKey, string | number>>;
  /** The conversation as it happened: the trader's words, and the field MANYA asked about. */
  turns: ({ trader: string } | { ask: FieldKey } | { say: string })[];
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

export const DEMO_CASES: DemoCase[] = [
  {
    key: "Kato Wholesalers Ltd",
    stage: "report",
    narrative:
      "I paid Kato Wholesalers 2,000,000 shillings by Mobile Money on 3 November 2026 for 40 bags of sugar. They promised to deliver by 10 November, but nothing has come and now they don't reply.",
    values: {
      "complainant.name": "Nakato Sarah",
      "complainant.business_name": "Nakato General Store",
      "complainant.phone": "0772 123456",
      "respondent.name": "Kato Wholesalers Ltd",
      "respondent.phone": "0701 987654",
      "transaction.date": "2026-11-03",
      "transaction.amount": 2_000_000,
      "transaction.currency": "UGX",
      "transaction.goods": "40 bags of sugar, 50 kg each",
      "transaction.agreement_type": "whatsapp",
      "delivery.expected_date": "2026-11-10",
      "delivery.status": "not_delivered",
      previous_communication:
        "Messaged and called the supplier on 11 and 18 November. He promised delivery 'next week', then stopped replying.",
      requested_resolution: "refund",
      arbitration_agreement: "no",
    },
    turns: [
      {
        trader:
          "I paid Kato Wholesalers 2,000,000 shillings by Mobile Money on 3 November 2026 for 40 bags of sugar. They promised to deliver by 10 November, but nothing has come and now they don't reply.",
      },
      { say: "intake.understood" },
      { ask: "transaction.agreement_type" },
      { trader: "We agreed on WhatsApp. He also sent me an invoice." },
      { ask: "requested_resolution" },
      { trader: "I want my money back." },
      { ask: "respondent.phone" },
      { trader: "0701 987654" },
      { ask: "previous_communication" },
      {
        trader:
          "I messaged and called him on 11 and 18 November. He said next week, then stopped replying.",
      },
      { ask: "arbitration_agreement" },
      { trader: "No, nothing like that." },
      { say: "intake.done" },
    ],
    documents: [
      {
        file: "momo-receipt-kato.png",
        mimeType: "image/png",
        category: "payment_evidence",
        extraction: doc({
          documentType: "Mobile Money payment receipt",
          date: "2026-11-03",
          amount: 2_000_000,
          currency: "UGX",
          reference: "58213907461",
          sender: "Nakato Sarah",
          recipient: "Kato Wholesalers Ltd",
          description: "Payment of UGX 2,000,000 for a sugar order.",
        }),
      },
      {
        file: "invoice-kato-INV-0412.pdf",
        mimeType: "application/pdf",
        category: "transaction_evidence",
        extraction: doc({
          documentType: "Proforma invoice INV-0412",
          date: "2026-11-02",
          amount: 2_000_000,
          currency: "UGX",
          reference: "INV-0412",
          sender: "Kato Wholesalers Ltd",
          recipient: "Nakato Sarah",
          description: "40 bags of sugar at UGX 50,000, delivery by 10 November 2026.",
        }),
      },
      {
        file: "chat-kato-wholesalers.png",
        mimeType: "image/png",
        category: "communication_evidence",
        extraction: doc({
          documentType: "Chat with the supplier",
          date: "2026-11-02",
          sender: "Kato Wholesalers (Kato John)",
          description:
            "Agreement on 40 bags for 2,000,000 with delivery by the 10th; the supplier confirms payment, then delays.",
        }),
      },
    ],
  },
  {
    key: "Ssemanda Brian",
    stage: "review",
    narrative:
      "I paid Ssemanda Brian 2,000,000 shillings on 12 November 2026 for 60 cartons of bar soap. He was to deliver within a week but has only made excuses.",
    values: {
      "complainant.name": "Nakato Sarah",
      "complainant.business_name": "Nakato General Store",
      "complainant.phone": "0772 123456",
      "respondent.name": "Ssemanda Brian",
      "respondent.phone": "0757 246810",
      "transaction.date": "2026-11-12",
      "transaction.amount": 2_000_000,
      "transaction.currency": "UGX",
      "transaction.goods": "60 cartons of bar soap",
      "transaction.agreement_type": "verbal",
      "delivery.status": "not_delivered",
      requested_resolution: "delivery",
    },
    turns: [
      {
        trader:
          "I paid Ssemanda Brian 2,000,000 shillings on 12 November 2026 for 60 cartons of bar soap. He was to deliver within a week but has only made excuses.",
      },
      { say: "intake.understood" },
      { ask: "transaction.agreement_type" },
      { trader: "We agreed by mouth at his shop." },
      { ask: "requested_resolution" },
      { trader: "I want him to deliver the goods." },
      { ask: "respondent.phone" },
      { trader: "0757 246810" },
    ],
    documents: [
      {
        file: "momo-receipt-ssemanda.png",
        mimeType: "image/png",
        category: "payment_evidence",
        extraction: doc({
          documentType: "Mobile Money payment receipt",
          date: "2026-11-12",
          amount: 1_500_000,
          currency: "UGX",
          reference: "58377120954",
          sender: "Nakato Sarah",
          recipient: "Ssemanda Brian",
          description: "Payment of UGX 1,500,000 for soap cartons.",
        }),
      },
    ],
  },
];

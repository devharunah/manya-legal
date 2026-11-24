import type { EvidenceDocument } from "@/lib/cases/types";
import { formatAmount, formatDate } from "@/lib/intake/display";
import type { Intake } from "@/lib/intake/fields";

/**
 * PRD 5.8: compare what documents show with what the report says. A flag
 * asks the trader to look; it never changes the report and never concludes
 * that anything is wrong.
 */
export type FlagKind = "amount" | "currency" | "date" | "respondent";

export interface ConsistencyFlag {
  documentId: string;
  kind: FlagKind;
  reportValue: string;
  documentValue: string;
}

/** Only these document types carry the payment itself. */
const PAYMENT_LIKE = new Set(["payment_evidence", "transaction_evidence"]);

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["ltd", "limited", "the", "and", "traders", "enterprises", "co"].includes(w),
    );

/** True when two names share a meaningful word ("Kato Wholesalers" ~ "KATO JOHN"). */
export function namesOverlap(a: string, b: string): boolean {
  const wa = new Set(words(a));
  return words(b).some((w) => wa.has(w));
}

export function checkConsistency(intake: Intake, documents: EvidenceDocument[]): ConsistencyFlag[] {
  const v = intake.values;
  const amount = v["transaction.amount"]?.value;
  const currency = v["transaction.currency"]?.value;
  const date = v["transaction.date"]?.value;
  const respondent = v["respondent.name"]?.value;
  const flags: ConsistencyFlag[] = [];

  for (const doc of documents) {
    const e = doc.extraction;
    if (!e || !PAYMENT_LIKE.has(doc.category)) continue;
    if (typeof amount === "number" && e.amount !== null && e.amount !== amount) {
      flags.push({
        documentId: doc.id,
        kind: "amount",
        reportValue: formatAmount(amount),
        documentValue: formatAmount(e.amount),
      });
    }
    if (typeof currency === "string" && e.currency && e.currency.toUpperCase() !== currency) {
      flags.push({
        documentId: doc.id,
        kind: "currency",
        reportValue: currency,
        documentValue: e.currency,
      });
    }
    // An invoice or order is usually dated before payment; only receipts carry the payment date.
    const isPayment = doc.category === "payment_evidence";
    if (isPayment && typeof date === "string" && e.date && e.date !== date) {
      flags.push({
        documentId: doc.id,
        kind: "date",
        reportValue: formatDate(date),
        documentValue: formatDate(e.date),
      });
    }
    if (
      isPayment &&
      typeof respondent === "string" &&
      e.recipient &&
      !namesOverlap(respondent, e.recipient)
    ) {
      flags.push({
        documentId: doc.id,
        kind: "respondent",
        reportValue: respondent,
        documentValue: e.recipient,
      });
    }
  }
  return flags;
}

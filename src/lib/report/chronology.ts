import type { EvidenceDocument } from "@/lib/cases/types";
import type { Translator } from "@/lib/i18n/translate";
import { lookup } from "@/lib/i18n/translate";
import type { Intake } from "@/lib/intake/fields";

export interface ChronologyEvent {
  /** ISO date, or null when the event has no known date. */
  date: string | null;
  text: string;
  source: "complainant" | "document";
}

/**
 * Events in date order (PRD 4.8, 5.9). Built only from dates the trader gave
 * or a document showed; undated events come last, never assigned a date.
 */
export function chronology(t: Translator, intake: Intake, documents: EvidenceDocument[]): ChronologyEvent[] {
  const events: ChronologyEvent[] = [];
  const paid = intake.values["transaction.date"];
  if (paid) {
    events.push({ date: String(paid.value), text: "Payment made to the supplier", source: "complainant" });
  }
  const due = intake.values["delivery.expected_date"];
  if (due) events.push({ date: String(due.value), text: "Agreed delivery date", source: "complainant" });
  for (const doc of documents) {
    const label = lookup(t, `category.${doc.category}`, doc.category);
    const what = doc.extraction?.documentType || label;
    events.push({
      date: doc.extraction?.date ?? null,
      text: `${what} (${doc.filename})`,
      source: "document",
    });
  }
  return events.sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date.localeCompare(b.date);
  });
}

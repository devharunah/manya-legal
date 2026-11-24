import type { EvidenceDocument } from "@/lib/cases/types";
import type { Translator } from "@/lib/i18n/translate";
import { lookup } from "@/lib/i18n/translate";
import type { Intake } from "@/lib/intake/fields";

export interface ChronologyEvent {
  /** ISO date, or null when the event has no known date. */
  date: string | null;
  text: string;
  source: "complainant" | "document";
  /** Never true from extraction alone: nothing here has been independently verified. */
  verified: false;
}

/**
 * Events in date order (PRD 4.8, 5.9; spec section 5). Built only from what
 * the trader described, the dates they gave, and dates shown on uploaded
 * documents. Undated events come last and are never given a date.
 */
export function chronology(
  t: Translator,
  intake: Intake,
  documents: EvidenceDocument[],
): ChronologyEvent[] {
  const events: ChronologyEvent[] = [];
  const told = intake.events ?? [];
  const toldOn = new Set(told.map((e) => e.date).filter(Boolean));
  for (const e of told) {
    events.push({
      date: e.date,
      text: e.text,
      source: e.source === "document" ? "document" : "complainant",
      verified: false,
    });
  }
  // Key dates from the report itself, unless the trader already described that day.
  const paid = intake.values["transaction.date"];
  if (paid && !toldOn.has(String(paid.value))) {
    events.push({
      date: String(paid.value),
      text: "Payment made to the supplier",
      source: "complainant",
      verified: false,
    });
  }
  const due = intake.values["delivery.expected_date"];
  if (due && !toldOn.has(String(due.value))) {
    events.push({
      date: String(due.value),
      text: "Agreed delivery date",
      source: "complainant",
      verified: false,
    });
  }
  for (const doc of documents) {
    const label = lookup(t, `category.${doc.category}`, doc.category);
    const what = doc.extraction?.documentType || label;
    events.push({
      date: doc.extraction?.date ?? null,
      text: `${what} (${doc.filename})`,
      source: "document",
      verified: false,
    });
  }
  return events.sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date.localeCompare(b.date);
  });
}

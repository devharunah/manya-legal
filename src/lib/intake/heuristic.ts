import type { DisputeCategory } from "@/lib/cases/types";

import { type FieldKey, fieldSpec } from "./fields";
import { amountsIn, currencyGrounded } from "./ground";
import type { Extraction } from "./merge";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** "2026-11-10", "10 November 2026", "10 Nov 2026" → ISO dates, in the order written. */
export function datesIn(text: string): string[] {
  const found: { at: number; iso: string }[] = [];
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    found.push({ at: m.index ?? 0, iso: m[0] });
  }
  for (const m of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(\d{4})\b/gi)) {
    const prefix = (m[2] ?? "").toLowerCase().slice(0, 3);
    const month = MONTHS.findIndex((name) => name.startsWith(prefix));
    if (month < 0) continue;
    found.push({
      at: m.index ?? 0,
      iso: `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`,
    });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.iso);
}

function choiceFromYesNo(asked: FieldKey, lower: string): string | null {
  const yes = /^\s*(yes|yeah|ye)\b/.test(lower);
  const no = /^\s*(no|none|nothing)\b/.test(lower);
  const unsure = /not sure|don'?t know/.test(lower);
  if (asked === "arbitration_agreement") {
    if (yes) return "yes";
    if (no) return "no";
    if (unsure) return "unsure";
  }
  if (asked === "delivery.status") {
    if (yes) return "partly_delivered";
    if (no) return "not_delivered";
  }
  return null;
}

/**
 * A rule-based reading of one message. Used in tests, and as the fallback
 * when no AI model is available, so intake never stops working. It only
 * picks up what is plainly written; anything else stays absent.
 */
export function heuristicExtract(
  text: string,
  asked: FieldKey | null,
): { extraction: Extraction; category: DisputeCategory | null } {
  const lower = text.toLowerCase();
  const e: Extraction = {};

  const amount = amountsIn(text).find((n) => n >= 1_000);
  if (amount) e["transaction.amount"] = amount;
  if (currencyGrounded("UGX", text)) e["transaction.currency"] = "UGX";

  const [first, second] = datesIn(text);
  if (first) {
    if (asked === "delivery.expected_date") e["delivery.expected_date"] = first;
    else {
      e["transaction.date"] = first;
      if (second) e["delivery.expected_date"] = second;
    }
  }

  if (/whats\s?app/.test(lower)) e["transaction.agreement_type"] = "whatsapp";
  else if (/\b(written|contract|signed)\b/.test(lower)) e["transaction.agreement_type"] = "written";
  else if (/\b(verbal|by mouth|spoken|orally)\b/.test(lower))
    e["transaction.agreement_type"] = "verbal";

  if (/(not|never|n't|yet to) (been )?deliver/.test(lower)) e["delivery.status"] = "not_delivered";
  else if (/\b(some|part|half) of the goods\b|partly delivered/.test(lower)) {
    e["delivery.status"] = "partly_delivered";
  }

  if (/refund|money back|return (my|the) money/.test(lower)) e["requested_resolution"] = "refund";
  else if (/(want|prefer|receive|get) the goods|deliver the goods/.test(lower)) {
    e["requested_resolution"] = "delivery";
  }

  if (asked && e[asked] === undefined) {
    const spec = fieldSpec(asked);
    if (spec.kind === "choice") {
      const choice = choiceFromYesNo(asked, lower);
      if (choice) e[asked] = choice;
    }
    if (spec.kind === "text" || spec.kind === "phone") {
      const answer = text.trim().replace(/[.!]+$/, "");
      if (answer) e[asked] = answer;
    }
  }

  const category: DisputeCategory | null = /deliver|supplier|paid|goods/.test(lower)
    ? "supplier_non_delivery"
    : null;
  return { extraction: e, category };
}

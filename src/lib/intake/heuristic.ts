import type { DisputeCategory } from "@/lib/cases/types";

import { type FieldKey, fieldSpec } from "./fields";
import { amountsIn, currencyGrounded } from "./ground";
import type { Extraction } from "./merge";
import { kampalaToday, relativeDatesIn } from "./relative-date";

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

/**
 * "2026-11-10", "10 November 2026", "10 Nov 2026" → ISO dates, in the order written.
 * Given `today`, relative days ("yesterday", "yesterday but one", "3 days ago") count too.
 */
export function datesIn(text: string, today?: string): string[] {
  const found: { at: number; iso: string }[] = today ? relativeDatesIn(text, today) : [];
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

const PHONE = /(?:\+?256[\s-]?|0)7\d{2}[\s-]?\d{3}[\s-]?\d{3}/g;
const NAME = /([A-Z][a-z']+(?:\s+[A-Z][a-z']+){1,3})/.source;

const DATE_PATTERNS = [
  /\d{4}-\d{2}-\d{2}/g,
  /\d{1,2}(?:st|nd|rd|th)?\s+[a-z]{3,9}\.?,?\s+\d{4}/gi,
  /\b(?:19|20)\d{2}\b(?![0-9,])/g,
];

const CLAUSE = {
  arbitrat: {
    unsure:
      /(not sure|don'?t know|unsure)[^.]{0,60}arbitrat|arbitrat[^.]{0,40}(not sure|don'?t know)/,
    no: /\b(no|nothing about|not|never|neither|without)\b[^.]{0,45}arbitrat|arbitrat[^.]{0,30}\b(no|not|none)\b/,
    yes: /(says|clause|agreed|requires|must go)[^.]{0,40}arbitrat/,
  },
  mediat: {
    unsure: /(not sure|don'?t know|unsure)[^.]{0,60}mediat|mediat[^.]{0,40}(not sure|don'?t know)/,
    no: /\b(no|nothing about|not|never|neither|without)\b[^.]{0,45}mediat|mediat[^.]{0,30}\b(no|not|none)\b/,
    yes: /(says|clause|agreed|requires|must go)[^.]{0,40}mediat/,
  },
} as const;

/** yes / no / unsure for a clause, from plain words around "arbitrat" or "mediat". */
function clause(lower: string, stem: keyof typeof CLAUSE): string | null {
  const rules = CLAUSE[stem];
  if (rules.unsure.test(lower)) return "unsure";
  if (rules.no.test(lower)) return "no";
  if (rules.yes.test(lower)) return "yes";
  return null;
}

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * A rule-based reading of one message. Used in tests, and as the fallback
 * when no AI model is available, so intake never stops working. It only
 * picks up what is plainly written; anything else stays absent.
 */
export function heuristicExtract(
  text: string,
  asking: FieldKey[] = [],
  today: string = kampalaToday(),
): {
  extraction: Extraction;
  category: DisputeCategory | null;
  events: { date: string | null; text: string }[];
} {
  const lower = text.toLowerCase();
  const asked = (key: FieldKey) => asking.includes(key);
  const e: Extraction = {};

  // Years and day numbers in dates are not amounts.
  const withoutDates = DATE_PATTERNS.reduce((t, re) => t.replace(re, " "), text);
  const amount = amountsIn(withoutDates).find((n) => n >= 1_000);
  if (amount) e["transaction.amount"] = amount;
  if (currencyGrounded("UGX", text)) e["transaction.currency"] = "UGX";

  const [first, second] = datesIn(text, today);
  if (first) {
    if (asked("delivery.expected_date") && !asked("transaction.date"))
      e["delivery.expected_date"] = first;
    else {
      e["transaction.date"] = first;
      if (second && /deliver|expect|by\b/.test(lower)) e["delivery.expected_date"] = second;
    }
  }

  // How the deal was made, and whether something records it.
  if (/whats\s?app/.test(lower)) e["transaction.agreement_type"] = "whatsapp";
  else if (/\binvoice\b/.test(lower)) e["transaction.agreement_type"] = "invoice";
  else if (/\b(signed|written contract|contract)\b/.test(lower))
    e["transaction.agreement_type"] = "written";
  else if (/\bsms\b/.test(lower)) e["transaction.agreement_type"] = "sms";
  else if (/\b(verbal|by mouth|spoken|orally)\b/.test(lower))
    e["transaction.agreement_type"] = "verbal";
  if (/whats\s?app|invoice|messages|contract|sms/.test(lower) && asked("agreement_record"))
    e.agreement_record = "yes";

  const arbitration = clause(lower, "arbitrat");
  if (arbitration && (asked("arbitration_agreement") || /arbitrat/.test(lower)))
    e.arbitration_agreement = arbitration;
  const mediation = clause(lower, "mediat");
  if (mediation && (asked("mediation_clause") || /mediat/.test(lower)))
    e.mediation_clause = mediation;
  if (/separate[^.]{0,40}arbitrat/.test(lower))
    e.separate_arbitration_agreement = /\bno\b|not/.test(lower) ? "no" : "yes";
  else if (arbitration === "no" && asked("separate_arbitration_agreement"))
    e.separate_arbitration_agreement = "no";
  if (/not sure|don'?t know/.test(lower) && !/arbitrat|mediat/.test(lower)) {
    if (asked("arbitration_agreement")) e.arbitration_agreement = "unsure";
    if (asked("mediation_clause")) e.mediation_clause = "unsure";
  }

  if (/mobile money|momo|\bmtn\b|airtel money/.test(lower))
    e["transaction.payment_method"] = "mobile_money";
  else if (/\bbank\b/.test(lower)) e["transaction.payment_method"] = "bank";
  else if (/\bcash\b/.test(lower)) e["transaction.payment_method"] = "cash";

  if (
    /(not|never|n't|yet to) (been )?(deliver|arriv)|no goods|nothing (has )?(come|arrived)/.test(
      lower,
    )
  ) {
    e["delivery.status"] = "not_delivered";
  } else if (/\b(some|part|half) of the goods\b|partly delivered/.test(lower)) {
    e["delivery.status"] = "partly_delivered";
  }

  const refund = /refund|money back|return (my|the) money/.test(lower);
  const delivery =
    /(want|prefer|receive|get) (the|my) (goods|merchandise|order)|deliver (the|my) (goods|merchandise)|delivery of the|(goods|merchandise|order|items) delivered/.test(
      lower,
    );
  if (refund && delivery) e.requested_resolution = "delivery_or_refund";
  else if (refund) e.requested_resolution = "refund";
  else if (delivery) e.requested_resolution = "delivery";

  const goods = /\bfor ((?:\d+ )?[a-z][a-z0-9 ,'-]{2,60}?)(?=[,.]| but| on | and | which|$)/.exec(
    lower,
  );
  if (goods?.[1] && !/^(the |a )?(payment|delivery|it|this|that)\b/.test(goods[1]))
    e["transaction.goods"] = goods[1].trim();

  // People and contacts.
  const phones = text.match(PHONE) ?? [];
  if (phones[0] && asked("respondent.phone")) e["respondent.phone"] = phones[0];
  else if (phones[0] && asked("complainant.phone")) e["complainant.phone"] = phones[0];
  const paid = new RegExp(String.raw`\bpaid (?:a supplier,? |the supplier,? )?` + NAME).exec(text);
  const named = new RegExp(
    String.raw`(?:supplier is|supplier's name is|name is|called)\s+` + NAME,
  ).exec(text);
  const leading = new RegExp(String.raw`^${NAME}\b`).exec(text.trim());
  const who = paid?.[1] ?? named?.[1] ?? (asked("respondent.name") ? leading?.[1] : undefined);
  if (who && !/^(I|We|The|My|Mobile|Money)\b/.test(who)) e["respondent.name"] = who;
  const business =
    /(?:\bof|business is|company is|trading as)\s+([A-Z][\w'&]*(?:\s+[A-Z][\w'&]*){0,4})/.exec(
      text,
    );
  if (business?.[1] && asked("respondent.business_name"))
    e["respondent.business_name"] = business[1];
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(text);
  if (email) e["complainant.email"] = email[0];

  const whole = text.trim().replace(/[.!]+$/, "");
  if (
    asked("previous_communication") &&
    /contact|call|messag|text|whats\s?app|follow|asked|told/.test(lower)
  ) {
    e.previous_communication = whole;
  }
  if (
    asked("evidence_available") &&
    /receipt|invoice|screenshot|chat|confirmation|record|statement|message/.test(lower)
  ) {
    e.evidence_available = whole;
  }
  // A single free-text question answered in a few words.
  const textAsked = asking.filter((k) => ["text", "phone"].includes(fieldSpec(k).kind));
  if (
    textAsked.length === 1 &&
    asking.length === 1 &&
    textAsked[0] &&
    e[textAsked[0]] === undefined &&
    whole
  ) {
    e[textAsked[0]] = whole;
  }

  const events = sentences(text)
    .map((sentence) => ({
      date: datesIn(sentence, today)[0] ?? null,
      text: sentence.replace(/[.!]+$/, ""),
    }))
    .filter((ev) => ev.date !== null);

  const category: DisputeCategory | null = /deliver|supplier|paid|goods/.test(lower)
    ? "supplier_non_delivery"
    : null;
  return { extraction: e, category, events };
}

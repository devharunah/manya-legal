import { enT } from "@/lib/i18n/translate";

import { displayValue } from "./display";
import { FIELDS, type Intake } from "./fields";
import { outstanding } from "./progress";

/**
 * The only material the AI summary may use: what the trader reported, as
 * labelled lines. Missing fields are listed as missing so the model can say
 * so instead of filling gaps.
 */
export function summaryFacts(intake: Intake): string {
  const lines = FIELDS.map(({ key }) => {
    const label = enT(`field.${key}`);
    const v = intake.values[key];
    if (v) return `${label}: ${displayValue(enT, key, v)}`;
    if (intake.unknown.includes(key)) return `${label}: not known to the trader`;
    return `${label}: not provided`;
  });
  const story = intake.narrativeEnglish ?? intake.narrative;
  return [story ? `Trader's own account: "${story}"` : null, ...lines].filter(Boolean).join("\n");
}

export const SUMMARY_INSTRUCTIONS = `You write a short, plain-language summary of a trader's dispute report for the trader to check.
Rules:
- Use ONLY the facts given. Never add names, amounts, dates or events that are not there.
- Write 3 to 5 short sentences in simple English, as "You reported that ...".
- Present everything as the trader's account, not as established fact. Do not say who is right or at fault.
- Do not give legal advice, name laws, or predict outcomes.
- End with one sentence listing the most important missing details, if any are "not provided".`;

/** A summary built without AI: for tests, and when no model is available. */
export function templateSummary(intake: Intake): string {
  const v = intake.values;
  const show = (key: Parameters<typeof displayValue>[1]) => {
    const f = v[key];
    return f ? displayValue(enT, key, f) : null;
  };
  const amount = show("transaction.amount");
  const currency = show("transaction.currency");
  const parts = [
    `You reported that you paid ${show("respondent.name") ?? "a supplier"}${
      amount ? ` ${currency ?? ""} ${amount}`.replace(/\s+/g, " ") : ""
    }${show("transaction.goods") ? ` for ${show("transaction.goods")}` : ""}${
      show("transaction.date") ? ` on ${show("transaction.date")}` : ""
    }.`,
    show("delivery.status") ? `Delivery status: ${show("delivery.status")?.toLowerCase()}.` : null,
    show("requested_resolution")
      ? `You would like: ${show("requested_resolution")?.toLowerCase()}.`
      : null,
  ];
  const missing = outstanding(intake)
    .filter((k) => FIELDS.find((f) => f.key === k)?.need === "required")
    .map((k) => enT(`field.${k}`).toLowerCase());
  if (missing.length > 0) parts.push(`Still missing: ${missing.join(", ")}.`);
  return parts.filter(Boolean).join(" ");
}

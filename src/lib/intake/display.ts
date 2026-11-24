import type { Translator } from "@/lib/i18n/translate";
import { lookup } from "@/lib/i18n/translate";

import { type FieldKey, type FieldValue, fieldSpec } from "./fields";

/** "2000000" → "2,000,000". */
export const formatAmount = (n: number) => n.toLocaleString("en-US");

/** "2026-11-10" → "10 November 2026"; anything unparseable is shown as given. */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** A field value as a person should read it. */
export function displayValue(t: Translator, key: FieldKey, field: FieldValue): string {
  const spec = fieldSpec(key);
  switch (spec.kind) {
    case "amount":
      return typeof field.value === "number" ? formatAmount(field.value) : String(field.value);
    case "date":
      return formatDate(String(field.value));
    case "choice":
      return lookup(t, `choice.${key}.${field.value}`, String(field.value));
    default:
      return String(field.value);
  }
}

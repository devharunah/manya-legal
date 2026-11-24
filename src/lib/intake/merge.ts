import {
  FIELDS,
  type FieldKey,
  type Intake,
  type Provenance,
  type TimelineEvent,
  fieldSpec,
} from "./fields";
import { amountGrounded, currencyGrounded, dateGrounded, phoneGrounded } from "./ground";

/** What the model may return for one message: any subset of fields, nulls for "not said". */
export type Extraction = Partial<Record<FieldKey, string | number | null>>;

export interface MergeResult {
  intake: Intake;
  /** Field values the model returned that the trader's words didn't support. */
  dropped: FieldKey[];
  /** Field values accepted from this message. */
  accepted: FieldKey[];
}

/** Normalises a value for its field, or null when it isn't valid or isn't grounded in `text`. */
export function acceptValue(
  key: FieldKey,
  raw: string | number,
  text: string,
): string | number | null {
  const spec = fieldSpec(key);
  switch (spec.kind) {
    case "amount": {
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
      return Number.isFinite(n) && n > 0 && amountGrounded(n, text) ? n : null;
    }
    case "date":
      return dateGrounded(String(raw), text) ? String(raw) : null;
    case "phone":
      return phoneGrounded(String(raw), text) ? String(raw).trim() : null;
    case "email": {
      const email = String(raw).trim().toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && text.toLowerCase().includes(email)
        ? email
        : null;
    }
    case "currency": {
      const code = String(raw).trim().toUpperCase();
      return currencyGrounded(code, text) ? code : null;
    }
    case "choice":
      return spec.choices?.includes(String(raw)) ? String(raw) : null;
    case "text": {
      const s = String(raw).trim();
      return s.length > 0 && s.length <= 300 ? s : null;
    }
  }
}

/**
 * Folds one message's extraction into the case. Confirmed values are never
 * overwritten; ungrounded values are dropped, not stored; nothing is filled in
 * that the extraction didn't contain.
 */
export function mergeExtraction(
  intake: Intake,
  extraction: Extraction,
  text: string,
  source: Provenance = "complainant",
): MergeResult {
  const values = { ...intake.values };
  let unknown = [...intake.unknown];
  const dropped: FieldKey[] = [];
  const accepted: FieldKey[] = [];

  for (const { key } of FIELDS) {
    const raw = extraction[key];
    if (raw === null || raw === undefined || raw === "") continue;
    if (values[key]?.confirmed) continue;
    const value = acceptValue(key, raw, text);
    if (value === null) {
      dropped.push(key);
      continue;
    }
    values[key] = { value, source, confirmed: false };
    unknown = unknown.filter((k) => k !== key);
    accepted.push(key);
  }
  return { intake: { ...intake, values, unknown }, dropped, accepted };
}

/** The trader said they don't know this. It is recorded as unknown, never guessed. */
export function markUnknown(intake: Intake, key: FieldKey): Intake {
  if (intake.unknown.includes(key)) return intake;
  const values = { ...intake.values };
  delete values[key];
  return { ...intake, values, unknown: [...intake.unknown, key] };
}

/**
 * An edit on the review screen. The trader typed it, so it is theirs and
 * confirmed; an empty value clears the field back to missing.
 */
export function editField(intake: Intake, key: FieldKey, raw: string): Intake {
  const trimmed = raw.trim();
  const unknown = intake.unknown.filter((k) => k !== key);
  if (trimmed === "") {
    const values = { ...intake.values };
    delete values[key];
    return { ...intake, values, unknown };
  }
  const spec = fieldSpec(key);
  let value: string | number = trimmed;
  if (spec.kind === "amount") {
    const n = Number(trimmed.replace(/[,\s]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return intake;
    value = n;
  }
  if (spec.kind === "currency") value = trimmed.toUpperCase();
  if (spec.kind === "choice" && !spec.choices?.includes(trimmed)) return intake;
  if (spec.kind === "date" && Number.isNaN(Date.parse(trimmed))) return intake;
  return {
    ...intake,
    values: { ...intake.values, [key]: { value, source: "complainant", confirmed: true } },
    unknown,
  };
}

/** The trader confirmed the whole report as accurate. */
export function confirmAll(intake: Intake): Intake {
  const values = Object.fromEntries(
    Object.entries(intake.values).map(([k, v]) => [k, { ...v, confirmed: true }]),
  ) as Intake["values"];
  return { ...intake, values };
}

/**
 * Adds timeline events from one message. A date is kept only if the trader
 * gave some date in that message; otherwise the event stays undated rather
 * than being given a guessed date. Repeats are ignored.
 */
export function mergeEvents(
  intake: Intake,
  events: { date: string | null; text: string }[],
  text: string,
): Intake {
  const existing = intake.events ?? [];
  const seen = new Set(existing.map((e) => e.text.toLowerCase()));
  const added: TimelineEvent[] = [];
  for (const e of events) {
    const description = e.text.trim().slice(0, 200);
    if (!description || seen.has(description.toLowerCase())) continue;
    seen.add(description.toLowerCase());
    added.push({
      date: e.date && dateGrounded(e.date, text) ? e.date : null,
      text: description,
      source: "trader",
    });
  }
  return added.length ? { ...intake, events: [...existing, ...added] } : intake;
}

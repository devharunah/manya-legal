/**
 * The supplier non-delivery intake schema (PRD 4.4), as flat field keys so
 * missing-field checks, questions and provenance are all keyed the same way.
 */

export const AGREEMENT_TYPES = ["written", "verbal", "whatsapp", "other"] as const;
export const DELIVERY_STATUSES = [
  "not_delivered",
  "partly_delivered",
  "delivered_late",
  "other",
] as const;
export const RESOLUTIONS = ["refund", "delivery", "other"] as const;
export const YES_NO = ["yes", "no", "unsure"] as const;

export type FieldKind = "text" | "phone" | "date" | "amount" | "currency" | "choice";

export interface FieldSpec {
  key: FieldKey;
  /** PRD 4.4: required, recommended, or only if available. */
  need: "required" | "recommended" | "optional";
  kind: FieldKind;
  choices?: readonly string[];
}

export const FIELDS = [
  { key: "complainant.name", need: "required", kind: "text" },
  { key: "complainant.business_name", need: "recommended", kind: "text" },
  { key: "complainant.phone", need: "required", kind: "phone" },
  { key: "respondent.name", need: "required", kind: "text" },
  { key: "respondent.phone", need: "optional", kind: "phone" },
  { key: "transaction.date", need: "required", kind: "date" },
  { key: "transaction.amount", need: "required", kind: "amount" },
  { key: "transaction.currency", need: "required", kind: "currency" },
  { key: "transaction.goods", need: "required", kind: "text" },
  { key: "transaction.agreement_type", need: "required", kind: "choice", choices: AGREEMENT_TYPES },
  { key: "delivery.expected_date", need: "optional", kind: "date" },
  { key: "delivery.status", need: "required", kind: "choice", choices: DELIVERY_STATUSES },
  { key: "previous_communication", need: "recommended", kind: "text" },
  { key: "requested_resolution", need: "required", kind: "choice", choices: RESOLUTIONS },
  // Not in PRD 4.4, but 6.2 needs it before arbitration can be suggested.
  { key: "arbitration_agreement", need: "recommended", kind: "choice", choices: YES_NO },
] as const satisfies readonly {
  key: string;
  need: string;
  kind: FieldKind;
  choices?: readonly string[];
}[];

export type FieldKey = (typeof FIELDS)[number]["key"];

export const FIELD_KEYS = FIELDS.map((f) => f.key) as FieldKey[];

export const fieldSpec = (key: FieldKey): FieldSpec =>
  FIELDS.find((f) => f.key === key) as FieldSpec;

/**
 * Where a value came from (PRD 4.8): the trader said it, a document showed it,
 * it was checked against an authority, or it still needs the trader's word.
 */
export type Provenance = "complainant" | "document" | "verified" | "awaiting";

export interface FieldValue {
  value: string | number;
  source: Provenance;
  /** The trader confirmed it on the review screen. Confirmed values are never overwritten. */
  confirmed: boolean;
}

export interface Intake {
  values: Partial<Record<FieldKey, FieldValue>>;
  /** Fields the trader said they don't know. Never asked again, never guessed. */
  unknown: FieldKey[];
  /** The trader's own words, as first told (PRD 10.4). */
  narrative: string | null;
  /** English version of the narrative, when it was told in Luganda. */
  narrativeEnglish: string | null;
}

export const emptyIntake = (): Intake => ({
  values: {},
  unknown: [],
  narrative: null,
  narrativeEnglish: null,
});

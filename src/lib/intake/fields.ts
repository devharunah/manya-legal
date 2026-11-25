/**
 * The dispute intake schema, as flat field keys so stages, missing-field
 * checks, questions, provenance and the report are all keyed the same way.
 * Stored as JSON inside `cases.intake`; new keys are additive, so cases
 * saved before a key existed simply don't have it yet.
 */

export const AGREEMENT_TYPES = [
  "written",
  "verbal",
  "whatsapp",
  "invoice",
  "sms",
  "other",
] as const;
export const DELIVERY_STATUSES = [
  "not_delivered",
  "partly_delivered",
  "delivered_late",
  "other",
] as const;
export const RESOLUTIONS = [
  "refund",
  "delivery",
  "delivery_or_refund",
  "money_owed",
  "compensation",
  "other",
] as const;
export const PAYMENT_METHODS = ["mobile_money", "bank", "cash", "other"] as const;
export const DISPUTE_STATUSES = ["ongoing", "resolved"] as const;
export const YES_NO = ["yes", "no", "unsure"] as const;

export type FieldKind = "text" | "phone" | "email" | "date" | "amount" | "currency" | "choice";

/**
 * The six-stage conversation (stage 3 is asked as two short questions:
 * the parties, then the transaction, and only for what is still missing).
 * "review" is the confirmation step, not a question.
 */
export const STAGES = [
  "overview",
  "agreement",
  "parties",
  "transaction",
  "events",
  "outcome",
] as const;
export type Stage = (typeof STAGES)[number];

/** Stage number shown to the trader (parties and transaction share stage 3). */
export const STAGE_STEP: Record<Stage, number> = {
  overview: 1,
  agreement: 2,
  parties: 3,
  transaction: 3,
  events: 4,
  outcome: 5,
};

export interface FieldSpec {
  key: FieldKey;
  /** required: needed for a useful report. recommended/optional: asked in the group, never chased. */
  need: "required" | "recommended" | "optional";
  kind: FieldKind;
  stage: Stage;
  /** Still missing after the stage was asked: worth one targeted clarification. */
  critical?: boolean;
  /** Extracted when mentioned, never asked for. */
  extractOnly?: boolean;
  choices?: readonly string[];
}

export const FIELDS = [
  // Stage 1: understand the dispute (from the trader's own account).
  {
    key: "dispute_status",
    need: "optional",
    kind: "choice",
    stage: "overview",
    extractOnly: true,
    choices: DISPUTE_STATUSES,
  },
  // Stage 2: agreement and dispute-resolution arrangements.
  {
    key: "transaction.agreement_type",
    need: "required",
    kind: "choice",
    stage: "agreement",
    choices: AGREEMENT_TYPES,
  },
  {
    key: "agreement_record",
    need: "recommended",
    kind: "choice",
    stage: "agreement",
    choices: YES_NO,
  },
  {
    key: "arbitration_agreement",
    need: "required",
    kind: "choice",
    stage: "agreement",
    critical: true,
    choices: YES_NO,
  },
  {
    key: "mediation_clause",
    need: "required",
    kind: "choice",
    stage: "agreement",
    critical: true,
    choices: YES_NO,
  },
  {
    key: "separate_arbitration_agreement",
    need: "optional",
    kind: "choice",
    stage: "agreement",
    choices: YES_NO,
  },
  // Stage 3a: the parties. The trader's own details usually come from the profile.
  { key: "complainant.name", need: "required", kind: "text", stage: "parties" },
  { key: "complainant.business_name", need: "recommended", kind: "text", stage: "parties" },
  { key: "complainant.phone", need: "required", kind: "phone", stage: "parties" },
  {
    key: "complainant.email",
    need: "optional",
    kind: "email",
    stage: "parties",
    extractOnly: true,
  },
  {
    key: "complainant.location",
    need: "optional",
    kind: "text",
    stage: "parties",
    extractOnly: true,
  },
  { key: "respondent.name", need: "required", kind: "text", stage: "parties", critical: true },
  { key: "respondent.business_name", need: "optional", kind: "text", stage: "parties" },
  { key: "respondent.phone", need: "recommended", kind: "phone", stage: "parties" },
  {
    key: "respondent.location",
    need: "optional",
    kind: "text",
    stage: "parties",
    extractOnly: true,
  },
  // Stage 3b: the transaction.
  { key: "transaction.date", need: "required", kind: "date", stage: "transaction" },
  {
    key: "transaction.amount",
    need: "required",
    kind: "amount",
    stage: "transaction",
    critical: true,
  },
  { key: "transaction.currency", need: "required", kind: "currency", stage: "transaction" },
  {
    key: "transaction.payment_method",
    need: "recommended",
    kind: "choice",
    stage: "transaction",
    choices: PAYMENT_METHODS,
  },
  {
    key: "transaction.goods",
    need: "required",
    kind: "text",
    stage: "transaction",
    critical: true,
  },
  { key: "delivery.expected_date", need: "optional", kind: "date", stage: "transaction" },
  // Stage 4: what happened and what has been done.
  {
    key: "delivery.status",
    need: "required",
    kind: "choice",
    stage: "events",
    critical: true,
    choices: DELIVERY_STATUSES,
  },
  { key: "previous_communication", need: "recommended", kind: "text", stage: "events" },
  // Stage 5: desired outcome and supporting evidence.
  {
    key: "requested_resolution",
    need: "required",
    kind: "choice",
    stage: "outcome",
    critical: true,
    choices: RESOLUTIONS,
  },
  { key: "evidence_available", need: "recommended", kind: "text", stage: "outcome" },
] as const satisfies readonly {
  key: string;
  need: string;
  kind: FieldKind;
  stage: Stage;
  critical?: boolean;
  extractOnly?: boolean;
  choices?: readonly string[];
}[];

export type FieldKey = (typeof FIELDS)[number]["key"];

export const FIELD_KEYS = FIELDS.map((f) => f.key) as FieldKey[];

export const fieldSpec = (key: FieldKey): FieldSpec =>
  FIELDS.find((f) => f.key === key) as FieldSpec;

/**
 * Where a value came from (PRD 4.8): the trader said it, a document showed it,
 * it was checked against an authority, or it still needs the trader's word.
 * Shown in the report as: reported by the trader (unverified), confirmed by
 * the trader, extracted from a document, or requires review.
 */
export type Provenance = "complainant" | "document" | "verified" | "awaiting";

export interface FieldValue {
  value: string | number;
  source: Provenance;
  /** The trader confirmed it on the review screen. Confirmed values are never overwritten. */
  confirmed: boolean;
}

/** One dated step in what happened (stage 4). Never marked verified by extraction alone. */
export interface TimelineEvent {
  /** ISO date when the trader gave one; null when they didn't. */
  date: string | null;
  text: string;
  source: "trader" | "document";
}

/** Conversation progress, decided by the backend (never by the model). */
export interface Workflow {
  /** How many times each stage's question was asked (1 = asked, 2 = clarified). */
  asked: Partial<Record<Stage, number>>;
  /** Substantive trader replies so far. The design target is six. */
  rounds: number;
}

export interface Intake {
  values: Partial<Record<FieldKey, FieldValue>>;
  /** Fields the trader said they don't know. Never asked again, never guessed. */
  unknown: FieldKey[];
  /** The trader's own words, as first told (PRD 10.4). */
  narrative: string | null;
  /** English version of the narrative, when it was told in Luganda. */
  narrativeEnglish: string | null;
  /** Added later; absent on older cases. */
  events?: TimelineEvent[];
  workflow?: Workflow;
  /** A live stage-demo case: prepared answers are read without AI (src/lib/demo/script.ts). */
  demo?: "live";
}

export const emptyIntake = (): Intake => ({
  values: {},
  unknown: [],
  narrative: null,
  narrativeEnglish: null,
  events: [],
  workflow: { asked: {}, rounds: 0 },
});

export const TARGET_ROUNDS = 6;

import { FIELDS, type FieldKey, type FieldSpec, type Intake, STAGES, type Stage } from "./fields";

const hasValue = (intake: Intake, key: FieldKey) => intake.values[key] !== undefined;
const settled = (intake: Intake, key: FieldKey) =>
  hasValue(intake, key) || intake.unknown.includes(key);

/** Required fields with no value and not marked unknown. Decided in code, never by the model. */
export function missingRequired(intake: Intake): FieldKey[] {
  return FIELDS.filter((f) => f.need === "required" && !settled(intake, f.key)).map((f) => f.key);
}

/** Share of required fields with a value, 0-100. Unknowns don't count as collected. */
export function completion(intake: Intake): number {
  const required = FIELDS.filter((f) => f.need === "required");
  const filled = required.filter((f) => hasValue(intake, f.key)).length;
  return Math.round((filled / required.length) * 100);
}

/** Every field still empty, for the report's "outstanding information" section. */
export function outstanding(intake: Intake): FieldKey[] {
  return (FIELDS as readonly FieldSpec[])
    .filter((f) => !f.extractOnly && !hasValue(intake, f.key))
    .map((f) => f.key);
}

/** Question keys, by stage. Variants avoid re-asking what the trader already said. */
export type QuestionKey =
  | "ask.agreement"
  | "ask.agreementClauses"
  | "ask.parties"
  | "ask.partiesBoth"
  | "ask.transaction"
  | "ask.events"
  | "ask.outcome"
  | "ask.evidence"
  | "ask.clarify";

export interface Step {
  stage: Stage;
  kind: "ask" | "clarify";
  question: QuestionKey;
  /** The fields this question is about: what the trader is answering, and what "I don't know" covers. */
  fields: FieldKey[];
}

const askable = (f: FieldSpec) => !f.extractOnly;
const stageFields = (stage: Stage) =>
  (FIELDS as readonly FieldSpec[]).filter((f) => f.stage === stage && askable(f));

function questionFor(stage: Stage, missing: FieldSpec[]): QuestionKey {
  const has = (key: FieldKey) => missing.some((f) => f.key === key);
  switch (stage) {
    case "agreement":
      return has("transaction.agreement_type") ? "ask.agreement" : "ask.agreementClauses";
    case "parties":
      return missing.some((f) => f.key.startsWith("complainant."))
        ? "ask.partiesBoth"
        : "ask.parties";
    case "transaction":
      return "ask.transaction";
    case "events":
      return "ask.events";
    case "outcome":
      return has("requested_resolution") ? "ask.outcome" : "ask.evidence";
    case "overview":
      return "ask.events";
  }
}

/**
 * The next question in the six-stage conversation, or null when it's time to
 * review. A stage is asked once, and only if a required or recommended
 * detail in it is still missing; the question covers just what is missing.
 * If a critical detail is still missing after that, one targeted
 * clarification is allowed. Then the conversation moves on and the gap is
 * listed as outstanding: accuracy over length, but no endless questioning.
 */
export function nextStep(intake: Intake): Step | null {
  // Stage 1 is the trader's opening account; nothing else is asked before it.
  if (!intake.narrative) return null;
  const asked = intake.workflow?.asked ?? {};
  for (const stage of STAGES) {
    if (stage === "overview") continue;
    const missing = stageFields(stage).filter((f) => !settled(intake, f.key));
    const times = asked[stage] ?? 0;
    if (times === 0) {
      if (missing.some((f) => f.need !== "optional")) {
        return {
          stage,
          kind: "ask",
          question: questionFor(stage, missing),
          fields: missing.map((f) => f.key),
        };
      }
      continue;
    }
    const critical = missing.filter((f) => f.critical);
    if (times === 1 && critical.length > 0) {
      return {
        stage,
        kind: "clarify",
        question: "ask.clarify",
        fields: critical.map((f) => f.key),
      };
    }
  }
  return null;
}

/** 1-6 progress for the trader, without exposing the internal stages. */
export function stepNumber(intake: Intake): number {
  const step = nextStep(intake);
  if (!intake.narrative) return 1;
  if (!step) return 6;
  return { overview: 1, agreement: 2, parties: 3, transaction: 3, events: 4, outcome: 5 }[
    step.stage
  ];
}

/** Records that a stage's question was asked. */
export function markAsked(intake: Intake, stage: Stage): Intake {
  const workflow = intake.workflow ?? { asked: {}, rounds: 0 };
  return {
    ...intake,
    workflow: {
      ...workflow,
      asked: { ...workflow.asked, [stage]: (workflow.asked[stage] ?? 0) + 1 },
    },
  };
}

export function countRound(intake: Intake): Intake {
  const workflow = intake.workflow ?? { asked: {}, rounds: 0 };
  return { ...intake, workflow: { ...workflow, rounds: workflow.rounds + 1 } };
}

/** Field list stored on MANYA's question message ("a,b,c"). Older messages hold one key. */
export const encodeFields = (fields: FieldKey[]) => fields.join(",");
export function decodeFields(stored: string | null): FieldKey[] {
  if (!stored) return [];
  const known = new Set<string>(FIELDS.map((f) => f.key));
  return stored.split(",").filter((k): k is FieldKey => known.has(k));
}

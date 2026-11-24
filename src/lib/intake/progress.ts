import { FIELDS, type FieldKey, type Intake } from "./fields";

const hasValue = (intake: Intake, key: FieldKey) => intake.values[key] !== undefined;
const settled = (intake: Intake, key: FieldKey) =>
  hasValue(intake, key) || intake.unknown.includes(key);

/** Required fields with no value and not marked unknown. Decided in code, never by the model. */
export function missingRequired(intake: Intake): FieldKey[] {
  return FIELDS.filter((f) => f.need === "required" && !settled(intake, f.key)).map((f) => f.key);
}

/**
 * The next field to ask about: required ones first, in PRD order, then the
 * recommended and optional ones. Null when every field is settled.
 */
export function nextField(intake: Intake): FieldKey | null {
  const required = missingRequired(intake)[0];
  if (required) return required;
  return FIELDS.find((f) => !settled(intake, f.key))?.key ?? null;
}

/** Share of required fields with a value, 0-100. Unknowns don't count as collected. */
export function completion(intake: Intake): number {
  const required = FIELDS.filter((f) => f.need === "required");
  const filled = required.filter((f) => hasValue(intake, f.key)).length;
  return Math.round((filled / required.length) * 100);
}

/** Every field still empty, for the report's "outstanding information" section. */
export function outstanding(intake: Intake): FieldKey[] {
  return FIELDS.filter((f) => !hasValue(intake, f.key)).map((f) => f.key);
}

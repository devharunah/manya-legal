import type { FieldKey, Intake } from "@/lib/intake/fields";

/**
 * The agreement and dispute-resolution assessment, decided in code from what
 * the trader reported (and later, documents). The model may explain it in
 * plain words; it never decides it.
 *
 * - A: an arbitration agreement appears to exist (a clause, or a separate written agreement).
 * - B: a mediation clause appears to exist.
 * - C: neither was identified. NOT "litigation is mandatory": negotiation and
 *      voluntary mediation stay open, and court-annexed mediation is possible
 *      after filing by mutual consent.
 * - D: the agreement or a clause is uncertain; no route is asserted until it is reviewed.
 * A and B can both apply.
 */
export type ClauseStatus = "identified" | "not_identified" | "unknown";
export type Scenario = "A" | "B" | "C" | "D";

export interface LegalAssessment {
  scenarios: Scenario[];
  /** How the deal was made and whether something records it. */
  agreement: "recorded" | "verbal_only" | "unknown";
  arbitration: ClauseStatus;
  arbitrationSource: "contract_clause" | "separate_agreement" | null;
  mediationClause: ClauseStatus;
  /** Arbitration was reported but nothing written was: the Act requires writing (s.3). */
  arbitrationWritingConcern: boolean;
  /** What to clarify or upload before any route is asserted (scenario D). */
  toClarify: FieldKey[];
  legalReviewRequired: boolean;
}

type Answer = "yes" | "no" | "unsure" | "missing";

function answer(intake: Intake, key: FieldKey): Answer {
  const v = intake.values[key]?.value;
  if (v === "yes" || v === "no" || v === "unsure") return v;
  return intake.unknown.includes(key) ? "unsure" : "missing";
}

export function legalAssessment(intake: Intake): LegalAssessment {
  const clause = answer(intake, "arbitration_agreement");
  const separate = answer(intake, "separate_arbitration_agreement");
  const mediation = answer(intake, "mediation_clause");
  const record = answer(intake, "agreement_record");
  const type = intake.values["transaction.agreement_type"]?.value;

  const arbitration: ClauseStatus =
    clause === "yes" || separate === "yes"
      ? "identified"
      : clause === "no" && separate !== "unsure"
        ? "not_identified"
        : "unknown";
  const mediationClause: ClauseStatus =
    mediation === "yes" ? "identified" : mediation === "no" ? "not_identified" : "unknown";

  const writtenTypes = ["written", "invoice", "whatsapp", "sms"];
  const agreement: LegalAssessment["agreement"] =
    record === "yes" || (typeof type === "string" && writtenTypes.includes(type))
      ? "recorded"
      : type === "verbal"
        ? "verbal_only"
        : "unknown";

  const toClarify: FieldKey[] = [];
  if (arbitration === "unknown") toClarify.push("arbitration_agreement");
  if (mediationClause === "unknown") toClarify.push("mediation_clause");
  if (agreement === "unknown") toClarify.push("transaction.agreement_type");

  const scenarios: Scenario[] = [];
  if (arbitration === "identified") scenarios.push("A");
  if (mediationClause === "identified") scenarios.push("B");
  if (toClarify.length > 0 && scenarios.length === 0) scenarios.push("D");
  if (arbitration === "not_identified" && mediationClause === "not_identified") scenarios.push("C");

  return {
    scenarios,
    agreement,
    arbitration,
    arbitrationSource:
      arbitration !== "identified"
        ? null
        : clause === "yes"
          ? "contract_clause"
          : "separate_agreement",
    mediationClause,
    arbitrationWritingConcern:
      arbitration === "identified" && agreement === "verbal_only" && separate !== "yes",
    toClarify,
    legalReviewRequired: !(scenarios.length === 1 && scenarios[0] === "C"),
  };
}

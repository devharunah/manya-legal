import { CHUNKS } from "@/data/kb/chunks";
import { PROVIDERS } from "@/data/providers";
import type { MessageKey } from "@/lib/i18n/en";
import { formatAmount } from "@/lib/intake/display";
import type { Intake } from "@/lib/intake/fields";

import { type LegalAssessment, legalAssessment } from "./assessment";

/**
 * Resolution pathways (PRD 6.2/6.3), decided by rules from the legal
 * assessment, never by the model. Every option is preliminary, says what
 * needs checking, and names the reviewed source it relies on. Pathways are
 * listed, not ranked.
 */
export type PathwayType =
  | "clarify_agreement"
  | "arbitration"
  | "agreed_mediation"
  | "negotiation"
  | "mediation"
  | "small_claims"
  | "legal_referral";
export type PathwayStatus = "potential_option" | "requires_further_assessment";

export interface Line {
  key: MessageKey;
  n?: string;
}

export interface Pathway {
  type: PathwayType;
  status: PathwayStatus;
  why: Line[];
  /** What must be checked before relying on this route. */
  check: Line[];
  steps: Line[];
  /** Knowledge-base chunks this route relies on. Empty when it rests on the parties' own agreement. */
  chunkIds: string[];
  providerIds: string[];
}

/** UGX 10,000,000: rule 5(1) of the Small Claims Procedure Rules, 2011 (chunk scp-r5). */
export const SMALL_CLAIMS_LIMIT_UGX = 10_000_000;
export const SMALL_CLAIMS_LIMIT_CHUNK = "scp-r5";

const providersFor = (type: PathwayType) =>
  PROVIDERS.filter((p) => p.pathways.includes(type)).map((p) => p.id);

/** Fails loudly in tests if a pathway cites a chunk that doesn't exist. */
export const knownChunk = (id: string) => CHUNKS.some((c) => c.id === id);

export function pathways(
  intake: Intake,
  assessment: LegalAssessment = legalAssessment(intake),
): Pathway[] {
  const v = intake.values;
  const amount =
    typeof v["transaction.amount"]?.value === "number" ? v["transaction.amount"].value : null;
  const currency = v["transaction.currency"] ? String(v["transaction.currency"].value) : null;
  const wantsDelivery = v.requested_resolution?.value === "delivery";
  const out: Pathway[] = [];

  // D: something material is unclear, so no route is asserted until it is reviewed.
  if (assessment.toClarify.length > 0) {
    out.push({
      type: "clarify_agreement",
      status: "requires_further_assessment",
      why: [{ key: "pathway.clarify_agreement.why" }],
      check: assessment.toClarify.map((key) => ({ key: `field.${key}` as MessageKey })),
      steps: [{ key: "pathway.clarify_agreement.steps" }],
      chunkIds: ["aca-s3"],
      providerIds: providersFor("clarify_agreement"),
    });
  }

  // A: an arbitration agreement appears to exist. Reported, not validated.
  if (assessment.arbitration === "identified") {
    out.push({
      type: "arbitration",
      status: "requires_further_assessment",
      why: [
        {
          key:
            assessment.arbitrationSource === "separate_agreement"
              ? "pathway.arbitration.whySeparate"
              : "pathway.arbitration.why",
        },
        ...(assessment.arbitrationWritingConcern
          ? [{ key: "pathway.arbitration.verbal" as const }]
          : []),
      ],
      check: [{ key: "pathway.arbitration.check" }],
      steps: [{ key: "pathway.arbitration.steps" }],
      chunkIds: ["aca-s3", "aca-s5", "aca-s67", "cadr-functions"],
      providerIds: providersFor("arbitration"),
    });
  }

  // B: a mediation clause appears to exist. Not treated as compulsory or as barring court.
  if (assessment.mediationClause === "identified") {
    out.push({
      type: "agreed_mediation",
      status: "requires_further_assessment",
      why: [{ key: "pathway.agreed_mediation.why" }],
      check: [{ key: "pathway.agreed_mediation.check" }],
      steps: [{ key: "pathway.agreed_mediation.steps" }],
      // Rests on the parties' own agreement; MANYA has no reviewed source on mediation clauses.
      chunkIds: [],
      providerIds: providersFor("agreed_mediation"),
    });
  }

  out.push({
    type: "negotiation",
    status: "potential_option",
    why: [{ key: "pathway.negotiation.why" }],
    check: [{ key: "pathway.negotiation.check" }],
    steps: [{ key: "pathway.negotiation.steps" }],
    chunkIds: ["sogssa-s34", wantsDelivery ? "sogssa-s63" : "sogssa-s66"],
    providerIds: [],
  });

  // Voluntary mediation is open in every scenario, clause or not; court-annexed
  // mediation is a later option after filing, by mutual consent (2026 Rules).
  out.push({
    type: "mediation",
    status: "potential_option",
    why: [
      {
        key:
          assessment.mediationClause === "identified"
            ? "pathway.mediation.whyWithClause"
            : "pathway.mediation.whyNoClause",
      },
    ],
    check: [{ key: "pathway.mediation.check" }],
    steps: [{ key: "pathway.mediation.steps" }],
    chunkIds: ["med-r3", "med-r12", "med-r39", "scp-r22"],
    providerIds: providersFor("mediation"),
  });

  // PRD 6.3 D: the limit is never the only condition, and is always "further assessment".
  const smallClaims: Line[] = [];
  if (amount === null) smallClaims.push({ key: "pathway.small_claims.whyUnknownAmount" });
  else if (currency !== null && currency !== "UGX") {
    smallClaims.push({ key: "pathway.small_claims.whyCurrency", n: currency });
  } else if (amount <= SMALL_CLAIMS_LIMIT_UGX) {
    smallClaims.push({ key: "pathway.small_claims.within", n: `UGX ${formatAmount(amount)}` });
  } else {
    smallClaims.push({ key: "pathway.small_claims.over", n: `UGX ${formatAmount(amount)}` });
  }
  if (wantsDelivery) smallClaims.push({ key: "pathway.small_claims.delivery" });
  if (assessment.arbitration === "identified")
    smallClaims.push({ key: "pathway.small_claims.arbitration" });
  out.push({
    type: "small_claims",
    status: "requires_further_assessment",
    why: smallClaims,
    check: [{ key: "pathway.small_claims.conditions" }],
    steps: [{ key: "pathway.small_claims.steps" }, { key: "pathway.small_claims.advocates" }],
    chunkIds: [
      SMALL_CLAIMS_LIMIT_CHUNK,
      "scp-leaflet-goods",
      "scp-r8",
      "scp-r10",
      "scp-r11",
      "scp-r18",
    ],
    providerIds: providersFor("small_claims"),
  });

  out.push({
    type: "legal_referral",
    status: "potential_option",
    why: [{ key: "pathway.legal_referral.why" }],
    check: [{ key: "pathway.legal_referral.check" }],
    steps: [{ key: "pathway.legal_referral.steps" }],
    chunkIds: ["sogssa-s62"],
    providerIds: providersFor("legal_referral"),
  });

  return out;
}

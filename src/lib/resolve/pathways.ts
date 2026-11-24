import { CHUNKS } from "@/data/kb/chunks";
import { PROVIDERS } from "@/data/providers";
import type { MessageKey } from "@/lib/i18n/en";
import { formatAmount } from "@/lib/intake/display";
import type { Intake } from "@/lib/intake/fields";

/**
 * Resolution pathways (PRD 6.2/6.3), decided by rules, not by the model.
 * Every option is preliminary and names the law it relies on.
 */
export type PathwayType =
  | "negotiation"
  | "mediation"
  | "arbitration"
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
  steps: Line[];
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

export function pathways(intake: Intake): Pathway[] {
  const v = intake.values;
  const amount =
    typeof v["transaction.amount"]?.value === "number" ? v["transaction.amount"].value : null;
  const currency = v["transaction.currency"] ? String(v["transaction.currency"].value) : null;
  const wantsDelivery = v.requested_resolution?.value === "delivery";
  const agreement = v["transaction.agreement_type"]?.value;
  const arbitration = v.arbitration_agreement?.value;
  const out: Pathway[] = [];

  out.push({
    type: "negotiation",
    status: "potential_option",
    why: [{ key: "pathway.negotiation.why" }],
    steps: [{ key: "pathway.negotiation.steps" }],
    chunkIds: ["sogssa-s34", wantsDelivery ? "sogssa-s63" : "sogssa-s66"],
    providerIds: [],
  });

  out.push({
    type: "mediation",
    status: "potential_option",
    why: [{ key: "pathway.mediation.why" }],
    steps: [{ key: "pathway.mediation.steps" }],
    chunkIds: ["med-r3", "med-r12", "med-r39", "scp-r22"],
    providerIds: providersFor("mediation"),
  });

  // PRD 6.3 C and acceptance criteria: arbitration is never suggested without an agreement.
  if (arbitration === "yes") {
    out.push({
      type: "arbitration",
      status: "requires_further_assessment",
      why: [
        { key: "pathway.arbitration.why" },
        ...(agreement === "verbal" ? [{ key: "pathway.arbitration.verbal" as const }] : []),
      ],
      steps: [{ key: "pathway.arbitration.steps" }],
      chunkIds: ["aca-s3", "aca-s5", "aca-s67", "cadr-functions"],
      providerIds: providersFor("arbitration"),
    });
  }

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
  smallClaims.push({ key: "pathway.small_claims.conditions" });
  out.push({
    type: "small_claims",
    status: "requires_further_assessment",
    why: smallClaims,
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
    steps: [{ key: "pathway.legal_referral.steps" }],
    chunkIds: ["sogssa-s62"],
    providerIds: providersFor("legal_referral"),
  });

  return out;
}

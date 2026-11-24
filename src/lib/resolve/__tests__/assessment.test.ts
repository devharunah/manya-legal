import { en } from "@/lib/i18n/en";
import { type Intake, emptyIntake } from "@/lib/intake/fields";
import { editField, markUnknown } from "@/lib/intake/merge";

import { legalAssessment } from "../assessment";
import { pathways } from "../pathways";

const intake = (edits: Record<string, string>, unknown: string[] = []): Intake => {
  let i = Object.entries(edits).reduce(
    (acc, [k, v]) => editField(acc, k as never, v),
    emptyIntake(),
  );
  for (const k of unknown) i = markUnknown(i, k as never);
  return i;
};
const types = (i: Intake) => pathways(i).map((p) => p.type);
const text = (i: Intake) =>
  pathways(i)
    .flatMap((p) => [...p.why, ...p.check, ...p.steps])
    .map((l) => en[l.key])
    .join(" ");

describe("legal routing scenarios (spec Part H)", () => {
  it("1. a written arbitration clause: identified, sourced, and flagged for review", () => {
    const i = intake({
      "transaction.agreement_type": "written",
      arbitration_agreement: "yes",
      mediation_clause: "no",
    });
    const a = legalAssessment(i);
    expect(a.scenarios).toEqual(["A"]);
    expect(a.arbitrationSource).toBe("contract_clause");
    expect(a.legalReviewRequired).toBe(true);
    const arb = pathways(i).find((p) => p.type === "arbitration");
    expect(arb?.status).toBe("requires_further_assessment");
    expect(arb?.chunkIds).toContain("aca-s3");
    expect(arb?.check.map((l) => l.key)).toContain("pathway.arbitration.check");
  });

  it("2. a mediation clause: recorded as mediation, never as arbitration", () => {
    const i = intake({
      "transaction.agreement_type": "written",
      arbitration_agreement: "no",
      mediation_clause: "yes",
    });
    expect(legalAssessment(i).scenarios).toEqual(["B"]);
    expect(types(i)).toContain("agreed_mediation");
    expect(types(i)).not.toContain("arbitration");
    expect(en["pathway.agreed_mediation.check"]).toContain(
      "does not necessarily stop either side from going to court",
    );
  });

  it("3. no clause: negotiation, voluntary mediation and court options, never mandatory litigation", () => {
    const i = intake({
      "transaction.agreement_type": "whatsapp",
      arbitration_agreement: "no",
      mediation_clause: "no",
    });
    const a = legalAssessment(i);
    expect(a.scenarios).toEqual(["C"]);
    expect(types(i)).toEqual(["negotiation", "mediation", "small_claims", "legal_referral"]);
    expect(text(i)).toContain("you don't need one: both sides can agree to mediation at any time");
    expect(text(i).toLowerCase()).not.toMatch(
      /must (go to|file in) court|litigation is (mandatory|required)/,
    );
  });

  it("4. a separate written arbitration agreement is recognised outside the contract", () => {
    const i = intake({
      "transaction.agreement_type": "verbal",
      arbitration_agreement: "no",
      separate_arbitration_agreement: "yes",
      mediation_clause: "no",
    });
    const a = legalAssessment(i);
    expect(a.arbitration).toBe("identified");
    expect(a.arbitrationSource).toBe("separate_agreement");
    expect(a.arbitrationWritingConcern).toBe(false);
    expect(pathways(i).find((p) => p.type === "arbitration")?.why[0]?.key).toBe(
      "pathway.arbitration.whySeparate",
    );
  });

  it("5. unknown agreement status: uncertainty recorded, no route asserted", () => {
    const i = intake({}, ["arbitration_agreement", "mediation_clause"]);
    const a = legalAssessment(i);
    expect(a.scenarios).toEqual(["D"]);
    expect(a.toClarify).toEqual(
      expect.arrayContaining([
        "arbitration_agreement",
        "mediation_clause",
        "transaction.agreement_type",
      ]),
    );
    expect(types(i)[0]).toBe("clarify_agreement");
    expect(types(i)).not.toContain("arbitration");
    expect(types(i)).not.toContain("agreed_mediation");
  });

  it("6. court-annexed mediation is offered as a later option by mutual consent (2026 Rules)", () => {
    for (const i of [
      intake({ arbitration_agreement: "no", mediation_clause: "no" }),
      intake({ arbitration_agreement: "yes", mediation_clause: "yes" }),
      intake({}, ["arbitration_agreement", "mediation_clause"]),
    ]) {
      const mediation = pathways(i).find((p) => p.type === "mediation");
      expect(mediation?.chunkIds).toEqual(expect.arrayContaining(["med-r3", "med-r12"]));
      expect(en[mediation?.why[0]?.key ?? "nav.home"]).toMatch(/court|2026 Rules/);
      expect(en["pathway.mediation.check"]).toContain("not a guaranteed right");
    }
  });

  it("warns when arbitration is reported for a verbal deal with nothing written", () => {
    const i = intake({
      "transaction.agreement_type": "verbal",
      arbitration_agreement: "yes",
      mediation_clause: "no",
    });
    expect(legalAssessment(i).arbitrationWritingConcern).toBe(true);
    expect(
      pathways(i)
        .find((p) => p.type === "arbitration")
        ?.why.map((l) => l.key),
    ).toContain("pathway.arbitration.verbal");
  });

  it("flags that a court may send the matter to arbitration when an arbitration agreement may apply", () => {
    const i = intake({
      "transaction.amount": "2000000",
      "transaction.currency": "UGX",
      arbitration_agreement: "yes",
    });
    expect(
      pathways(i)
        .find((p) => p.type === "small_claims")
        ?.why.map((l) => l.key),
    ).toContain("pathway.small_claims.arbitration");
  });
});

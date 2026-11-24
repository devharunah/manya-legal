/** @jest-environment node */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { EvidenceDocument } from "@/lib/cases/types";
import { createMemoryStore } from "@/lib/db/memory";
import { checkConsistency } from "@/lib/evidence/consistency";
import { type FieldKey, type Intake, emptyIntake } from "@/lib/intake/fields";
import { acceptValue } from "@/lib/intake/merge";
import { missingRequired } from "@/lib/intake/progress";
import { legalAssessment } from "@/lib/resolve/assessment";
import { pathways } from "@/lib/resolve/pathways";

import { DEMO_CASES, DEMO_FILES, type DemoCase, INCONSISTENCY_DEMO, PRIMARY_DEMO } from "../cases";
import { seedDemo } from "../seed";

const intakeOf = (demo: DemoCase): Intake => ({
  ...emptyIntake(),
  values: Object.fromEntries(
    Object.entries(demo.values).map(([k, value]) => [
      k,
      { value, source: "complainant", confirmed: true },
    ]),
  ) as Intake["values"],
  events: demo.events,
});

const asDocs = (demo: DemoCase): EvidenceDocument[] =>
  demo.documents.map(
    (d, i) => ({ id: `d${i}`, category: d.category, extraction: d.extraction }) as EvidenceDocument,
  );

describe("demo cases (spec Part F)", () => {
  it("use valid values, and all four SAMPLE files exist under their specified names", () => {
    for (const demo of DEMO_CASES) {
      for (const [key, value] of Object.entries(demo.values) as [FieldKey, string | number][]) {
        const grounding = `${value} UGX shillings ${String(value).toLowerCase()}`;
        expect(acceptValue(key, value, grounding)).not.toBeNull();
      }
      for (const d of demo.documents)
        expect(existsSync(join(process.cwd(), "public/demo", d.file))).toBe(true);
    }
    expect(DEMO_FILES).toEqual([
      "SAMPLE_mobile_money_payment_confirmation.pdf",
      "SAMPLE_commercial_invoice.pdf",
      "SAMPLE_whatsapp_supplier_conversation.png",
      "SAMPLE_trader_statement.pdf",
    ]);
  });

  it("the primary demo is complete and internally consistent: same amount, names and dates", () => {
    const intake = intakeOf(PRIMARY_DEMO);
    expect(missingRequired(intake)).toEqual([]);
    expect(checkConsistency(intake, asDocs(PRIMARY_DEMO))).toEqual([]);
    for (const d of PRIMARY_DEMO.documents) expect(d.extraction.amount).toBe(2_000_000);
    expect(PRIMARY_DEMO.events.map((e) => e.date)).toEqual([
      "2026-11-10",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-14",
      "2026-11-15",
      "2026-11-18",
    ]);
  });

  it("the primary demo routes to scenario C: negotiation, voluntary mediation, court options; never mandatory litigation", () => {
    const intake = intakeOf(PRIMARY_DEMO);
    const a = legalAssessment(intake);
    expect(a.scenarios).toEqual(["C"]);
    // WhatsApp records the deal even without a signed contract.
    expect(a.agreement).toBe("recorded");
    expect(pathways(intake).map((p) => p.type)).toEqual([
      "negotiation",
      "mediation",
      "small_claims",
      "legal_referral",
    ]);
  });

  it("the second demo shows the PRD amount mismatch and an uncertain agreement", () => {
    const intake = intakeOf(INCONSISTENCY_DEMO);
    expect(
      checkConsistency(intake, asDocs(INCONSISTENCY_DEMO)).map((f) => [
        f.kind,
        f.reportValue,
        f.documentValue,
      ]),
    ).toEqual([["amount", "2,000,000", "1,500,000"]]);
    expect(legalAssessment(intake).scenarios).toEqual(["D"]);
  });

  it("seeds a session once: report for the primary case, the second awaiting confirmation", async () => {
    const store = createMemoryStore(`demo-${Math.random()}`);
    await seedDemo(store);
    await seedDemo(store);
    const cases = await store.listCases();
    expect(cases).toHaveLength(2);
    const primary = cases.find(
      (c) => c.intake.values["respondent.name"]?.value === "Daniel Okello",
    );
    const second = cases.find(
      (c) => c.intake.values["respondent.name"]?.value === "Brian Ssemanda",
    );
    expect(primary?.status).toBe("report_generated");
    expect(primary?.intake.events).toHaveLength(7);
    expect(second?.status).toBe("awaiting_user_confirmation");
    expect(await store.listReports(primary?.id ?? "")).toHaveLength(1);
    expect(await store.listDocuments({ caseId: primary?.id ?? "" })).toHaveLength(4);
    expect(await store.listDocuments({ caseId: second?.id ?? "" })).toHaveLength(1);
    expect((await store.getProfile())?.fullName).toBe("Sarah Namusoke");
    // Builds real PDFs; slow when the whole suite runs in parallel.
  }, 60_000);
});

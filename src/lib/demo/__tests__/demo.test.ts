/** @jest-environment node */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { EvidenceDocument } from "@/lib/cases/types";
import { createMemoryStore } from "@/lib/db/memory";
import { checkConsistency } from "@/lib/evidence/consistency";
import { type FieldKey, type Intake, emptyIntake } from "@/lib/intake/fields";
import { acceptValue } from "@/lib/intake/merge";
import { missingRequired } from "@/lib/intake/progress";

import { DEMO_CASES, type DemoCase } from "../cases";
import { seedDemo } from "../seed";

const intakeOf = (demo: DemoCase): Intake => ({
  ...emptyIntake(),
  values: Object.fromEntries(
    Object.entries(demo.values).map(([k, value]) => [
      k,
      { value, source: "complainant", confirmed: true },
    ]),
  ) as Intake["values"],
});

const asDocs = (demo: DemoCase): EvidenceDocument[] =>
  demo.documents.map(
    (d, i) => ({ id: `d${i}`, category: d.category, extraction: d.extraction }) as EvidenceDocument,
  );

describe("demo cases", () => {
  it("only use valid values, and every SAMPLE file exists", () => {
    for (const demo of DEMO_CASES) {
      for (const [key, value] of Object.entries(demo.values) as [FieldKey, string | number][]) {
        // Grounded against itself: checks the value is valid for its field type.
        expect(acceptValue(key, value, `${value} UGX shillings`)).not.toBeNull();
      }
      for (const d of demo.documents)
        expect(existsSync(join(process.cwd(), "src/assets/demo", d.file))).toBe(true);
    }
  });

  it("case 1 is complete and consistent; case 2 shows the PRD amount mismatch", () => {
    const [kato, ssemanda] = DEMO_CASES as [DemoCase, DemoCase];
    expect(missingRequired(intakeOf(kato))).toEqual([]);
    expect(checkConsistency(intakeOf(kato), asDocs(kato))).toEqual([]);
    expect(
      checkConsistency(intakeOf(ssemanda), asDocs(ssemanda)).map((f) => [
        f.kind,
        f.reportValue,
        f.documentValue,
      ]),
    ).toEqual([["amount", "2,000,000", "1,500,000"]]);
  });

  it("seeds a session once, with a report for case 1 and case 2 awaiting confirmation", async () => {
    const store = createMemoryStore(`demo-${Math.random()}`);
    await seedDemo(store);
    await seedDemo(store);
    const cases = await store.listCases();
    expect(cases).toHaveLength(2);
    const kato = cases.find(
      (c) => c.intake.values["respondent.name"]?.value === "Kato Wholesalers Ltd",
    );
    const ssemanda = cases.find(
      (c) => c.intake.values["respondent.name"]?.value === "Ssemanda Brian",
    );
    expect(kato?.status).toBe("report_generated");
    expect(ssemanda?.status).toBe("awaiting_user_confirmation");
    expect(await store.listReports(kato?.id ?? "")).toHaveLength(1);
    expect(await store.listDocuments({ caseId: kato?.id ?? "" })).toHaveLength(3);
    expect((await store.getProfile())?.fullName).toBe("Nakato Sarah");
    // Builds a real PDF; slow when the whole suite runs in parallel.
  }, 30_000);
});

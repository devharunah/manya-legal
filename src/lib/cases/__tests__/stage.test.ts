import { emptyIntake } from "@/lib/intake/fields";

import { caseStage } from "../stage";
import type { CaseRecord } from "../types";

const record = (status: CaseRecord["status"]) => ({ status, intake: emptyIntake() });
const doc = (userConfirmed: boolean) => ({ userConfirmed });

describe("caseStage", () => {
  it("is Report until a report exists", () => {
    const s = caseStage({
      record: record("collecting_information"),
      reports: 0,
      documents: [doc(true)],
      referrals: 0,
    });
    expect(s.current).toBe("report");
    expect(s.progress).toBeLessThanOrEqual(95);
  });

  it("is Organise after the report while evidence is missing or unconfirmed", () => {
    expect(
      caseStage({ record: record("report_generated"), reports: 1, documents: [], referrals: 0 }),
    ).toEqual({ current: "organise", progress: 0, detail: null });
    expect(
      caseStage({
        record: record("report_generated"),
        reports: 1,
        documents: [doc(true), doc(false), doc(true)],
        referrals: 0,
      }),
    ).toEqual({ current: "organise", progress: 67, detail: "2/3" });
  });

  it("is Resolve once evidence is confirmed or a referral exists", () => {
    expect(
      caseStage({
        record: record("report_generated"),
        reports: 1,
        documents: [doc(true)],
        referrals: 0,
      }).current,
    ).toBe("resolve");
    expect(
      caseStage({ record: record("report_generated"), reports: 1, documents: [], referrals: 1 }),
    ).toEqual({ current: "resolve", progress: 100, detail: null });
  });

  it("has no current stage when closed", () => {
    expect(
      caseStage({ record: record("completed"), reports: 1, documents: [], referrals: 1 }).current,
    ).toBeNull();
  });
});

import { completion } from "@/lib/intake/progress";

import type { CaseRecord } from "./types";

/** The three stages a trader sees (Report → Organise → Resolve). */
export type CaseStage = "report" | "organise" | "resolve";
export const CASE_STAGES: readonly CaseStage[] = ["report", "organise", "resolve"];

export interface StageState {
  /** The stage the trader is on now, or null when the case is closed. */
  current: CaseStage | null;
  /** 0-100 within the current stage. */
  progress: number;
  /** Shown next to the current stage, e.g. "3 of 5". */
  detail: string | null;
}

interface StageInput {
  record: Pick<CaseRecord, "status" | "intake">;
  reports: number;
  documents: { userConfirmed: boolean }[];
  referrals: number;
}

/**
 * Where a case is, worked out from what exists, never stored:
 * no report yet → Report (progress = required details collected);
 * report but evidence not all confirmed → Organise (progress = confirmed share);
 * evidence confirmed or a referral prepared → Resolve; completed → closed.
 */
export function caseStage({ record, reports, documents, referrals }: StageInput): StageState {
  if (record.status === "completed") return { current: null, progress: 100, detail: null };
  const reported = reports > 0 || record.status === "report_generated";
  if (!reported) {
    return { current: "report", progress: Math.min(completion(record.intake), 95), detail: null };
  }
  const confirmed = documents.filter((d) => d.userConfirmed).length;
  if (referrals === 0 && (documents.length === 0 || confirmed < documents.length)) {
    return {
      current: "organise",
      progress: documents.length === 0 ? 0 : Math.round((confirmed / documents.length) * 100),
      detail: documents.length === 0 ? null : `${confirmed}/${documents.length}`,
    };
  }
  return { current: "resolve", progress: referrals > 0 ? 100 : 50, detail: null };
}

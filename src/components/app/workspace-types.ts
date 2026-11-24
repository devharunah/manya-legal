import type { CaseRecord, EvidenceDocument, Message, Referral, Report } from "@/lib/cases/types";

/** Everything GET /api/cases/[id] returns. */
export interface Workspace {
  case: CaseRecord;
  messages: Message[];
  reports: Report[];
  documents: EvidenceDocument[];
  referrals: Referral[];
}

export type WorkspaceUpdate = (fn: (w: Workspace) => Workspace) => void;

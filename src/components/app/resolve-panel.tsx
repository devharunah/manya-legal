"use client";

import type { CaseRecord, EvidenceDocument, Referral, Report } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

import type { WorkspaceUpdate } from "./workspace-types";

/** PRD module 3 (Resolve). Pathways and referrals arrive in a later PR. */
export function ResolvePanel(_props: {
  record: CaseRecord;
  reports: Report[];
  documents: EvidenceDocument[];
  referrals: Referral[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-brand-900">{t("resolve.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("resolve.needReport")}</p>
    </section>
  );
}

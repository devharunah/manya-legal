"use client";

import type { CaseRecord, EvidenceDocument } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

import type { WorkspaceUpdate } from "./workspace-types";

/** PRD module 2 (Organise). Upload and extraction arrive in the next PR. */
export function EvidencePanel(_props: {
  record: CaseRecord;
  documents: EvidenceDocument[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-brand-900">{t("evidence.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("evidence.body")}</p>
    </section>
  );
}

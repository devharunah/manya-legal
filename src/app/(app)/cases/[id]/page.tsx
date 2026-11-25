"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StatusPill } from "@/components/app/case-list";
import { api } from "@/components/app/client-api";
import { EvidencePanel } from "@/components/app/evidence-panel";
import { IntakeChat } from "@/components/app/intake-chat";
import { ResolvePanel } from "@/components/app/resolve-panel";
import { ReviewPanel } from "@/components/app/review-panel";
import { RequireProfile } from "@/components/app/session";
import type { Workspace } from "@/components/app/workspace-types";
import { StageProgress } from "@/components/manya/stage-progress";
import { caseStage } from "@/lib/cases/stage";
import { useT } from "@/lib/i18n/use-t";

const TABS = ["report", "organise", "resolve"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL = {
  report: "case.tabReport",
  organise: "case.tabOrganise",
  resolve: "case.tabResolve",
} as const;

function CaseWorkspace({ id }: { id: string }) {
  const t = useT();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("report");

  useEffect(() => {
    api<Workspace>(`/api/cases/${id}`)
      .then(setWorkspace)
      .catch((e: { status?: number; message: string }) =>
        setError(e.status === 404 ? t("cases.notFound") : e.message),
      );
  }, [id, t]);

  const update = useCallback((fn: (w: Workspace) => Workspace) => {
    setWorkspace((w) => (w ? fn(w) : w));
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (!workspace) {
    return (
      <output className="grid place-items-center py-24 text-ink-3">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">{t("case.loading")}</span>
      </output>
    );
  }

  const { case: record, messages, reports, documents, referrals } = workspace;
  const stage = caseStage({
    record,
    reports: reports.length,
    documents,
    referrals: referrals.length,
  });
  const showReview =
    (record.status !== "draft" && record.status !== "collecting_information") || reports.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-3 hover:text-brand-800"
        >
          <ArrowLeft className="size-4" aria-hidden /> {t("case.back")}
        </Link>
      </div>
      <header className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-bold text-brand-900">{record.reference}</h1>
          <StatusPill status={record.status} />
        </div>
        <StageProgress stage={stage} className="mt-4" />
      </header>

      <div
        role="tablist"
        aria-label={record.reference}
        className="grid grid-cols-3 gap-1 rounded-2xl bg-brand-50 p-1"
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-800 transition aria-selected:bg-white aria-selected:shadow-sm"
          >
            {t(TAB_LABEL[name])}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "report" && (
          <div className="space-y-5">
            <IntakeChat record={record} messages={messages} update={update} />
            {showReview && <ReviewPanel record={record} reports={reports} update={update} />}
          </div>
        )}
        {tab === "organise" && (
          <EvidencePanel record={record} documents={documents} update={update} />
        )}
        {tab === "resolve" && (
          <ResolvePanel
            record={record}
            reports={reports}
            documents={documents}
            referrals={referrals}
            update={update}
          />
        )}
      </div>
    </div>
  );
}

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <RequireProfile>{() => <CaseWorkspace id={id} />}</RequireProfile>
    </div>
  );
}

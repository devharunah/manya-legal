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
import { useT } from "@/lib/i18n/use-t";
import { completion } from "@/lib/intake/progress";

const TABS = ["report", "organise", "resolve"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL = {
  report: "case.tabReport",
  organise: "case.tabOrganise",
  resolve: "case.tabResolve",
} as const;

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex justify-between text-xs font-semibold text-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <progress
        value={value}
        max={100}
        aria-label={label}
        className="mt-1 block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-line [&::-moz-progress-bar]:bg-brand-600 [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:bg-brand-600"
      />
    </div>
  );
}

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
      <p role="alert" className="rounded-2xl border border-line bg-white p-6 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!workspace) {
    return (
      <output className="grid place-items-center py-24 text-muted">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">{t("case.loading")}</span>
      </output>
    );
  }

  const { case: record, messages, reports, documents, referrals } = workspace;
  const reportDone = reports.length > 0 ? 100 : Math.min(completion(record.intake), 95);
  const evidence =
    documents.length === 0
      ? 0
      : Math.round((documents.filter((d) => d.userConfirmed).length / documents.length) * 100);
  const showReview =
    (record.status !== "draft" && record.status !== "collecting_information") || reports.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand-800"
        >
          <ArrowLeft className="size-4" aria-hidden /> {t("case.back")}
        </Link>
      </div>
      <header className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-bold text-brand-900">{record.reference}</h1>
          <StatusPill status={record.status} />
        </div>
        <div className="mt-4 flex gap-4">
          <Progress label={t("case.progressReport")} value={reportDone} />
          <Progress label={t("case.progressEvidence")} value={evidence} />
          <Progress label={t("case.progressResolve")} value={referrals.length > 0 ? 100 : 0} />
        </div>
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
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <RequireProfile>{() => <CaseWorkspace id={id} />}</RequireProfile>
    </main>
  );
}

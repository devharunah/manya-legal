"use client";

import { Download, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CaseFilePanel } from "@/components/app/case-file-panel";
import { api } from "@/components/app/client-api";
import { EvidencePanel } from "@/components/app/evidence-panel";
import { IntakeChat } from "@/components/app/intake-chat";
import { ResolvePanel } from "@/components/app/resolve-panel";
import { ReviewPanel } from "@/components/app/review-panel";
import { RequireProfile } from "@/components/app/session";
import type { Workspace } from "@/components/app/workspace-types";
import { FactTable, Timeline } from "@/components/manya/blocks";
import { StageProgress } from "@/components/manya/stage-progress";
import { SampleTag, StatusBadge, isDemoCase } from "@/components/manya/tags";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { type CaseStage, caseStage } from "@/lib/cases/stage";
import type { CaseRecord } from "@/lib/cases/types";
import { checkConsistency } from "@/lib/evidence/consistency";
import type { Translator } from "@/lib/i18n/translate";
import { useT } from "@/lib/i18n/use-t";
import { displayValue, formatAmount, formatDate } from "@/lib/intake/display";
import type { FieldKey } from "@/lib/intake/fields";
import { chronology } from "@/lib/report/chronology";
import { cn } from "@/lib/utils";

const TABS = ["overview", "evidence", "report", "resolve"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL = {
  overview: "case.tabOverview",
  evidence: "case.tabEvidence",
  report: "case.tabReport",
  resolve: "case.tabResolve",
} as const;

/** The tab that matches where the case is (design: open on the stage's tab). */
const TAB_FOR_STAGE: Record<CaseStage, Tab> = {
  report: "report",
  organise: "evidence",
  resolve: "resolve",
};

/** "Household merchandise · not delivered · UGX 2,000,000". */
function summaryLine(t: Translator, record: CaseRecord): string {
  const v = record.intake.values;
  const parts: string[] = [];
  if (v["transaction.goods"]) parts.push(String(v["transaction.goods"].value));
  if (v["delivery.status"]) parts.push(displayValue(t, "delivery.status", v["delivery.status"]));
  const amount = v["transaction.amount"]?.value;
  if (typeof amount === "number") {
    parts.push(`${v["transaction.currency"]?.value ?? "UGX"} ${formatAmount(amount)}`);
  }
  return parts.join(" · ");
}

const OVERVIEW_FIELDS: FieldKey[] = [
  "respondent.name",
  "respondent.business_name",
  "respondent.phone",
  "transaction.goods",
  "transaction.amount",
  "transaction.date",
  "transaction.payment_method",
  "delivery.expected_date",
  "delivery.status",
  "requested_resolution",
];

function Overview({ workspace }: { workspace: Workspace }) {
  const t = useT();
  const { case: record, documents } = workspace;
  const v = record.intake.values;
  const rows = OVERVIEW_FIELDS.map((key) => {
    const field = v[key];
    let value = field ? displayValue(t, key, field) : t("review.notProvided");
    if (field && key === "transaction.amount") {
      value = `${v["transaction.currency"]?.value ?? ""} ${value}`.trim();
    }
    return { label: t(`field.${key}`), value, muted: !field };
  });
  const events = chronology(t, record.intake, documents);
  return (
    <div className="flex flex-wrap gap-5">
      <section className="flex min-w-0 flex-[2_1_380px] flex-col gap-3">
        <h2 className="font-display text-[17px] font-semibold">{t("case.facts")}</h2>
        <FactTable rows={rows} />
      </section>
      <section className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
        <h2 className="font-display text-[17px] font-semibold">{t("review.events")}</h2>
        <div className="rounded-lg border border-line bg-paper p-4">
          {events.length === 0 ? (
            <p className="text-sm text-ink-3">{t("case.noEvents")}</p>
          ) : (
            <Timeline
              items={events.map((e, i) => ({
                key: `${i}-${e.date}`,
                date: e.date ? formatDate(e.date) : t("case.dateUnknown"),
                text: e.text,
              }))}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function CaseWorkspace({ id }: { id: string }) {
  const t = useT();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [building, setBuilding] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Workspace>(`/api/cases/${id}`)
      .then((w) => {
        setWorkspace(w);
        // Open on the tab for the case's stage, once; later changes don't move the trader.
        const at = caseStage({
          record: w.case,
          reports: w.reports.length,
          documents: w.documents,
          referrals: w.referrals.length,
        }).current;
        setTab((current) => current ?? (at ? TAB_FOR_STAGE[at] : "overview"));
      })
      .catch((e: { status?: number; message: string }) =>
        setError(e.status === 404 ? t("cases.notFound") : e.message),
      );
  }, [id, t]);

  const update = useCallback((fn: (w: Workspace) => Workspace) => {
    setWorkspace((w) => (w ? fn(w) : w));
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-paper p-6 text-sm text-danger">
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
  const current: Tab = tab ?? "report";
  const flags = checkConsistency(record.intake, documents);
  const latest = reports[0];
  const showReview =
    (record.status !== "draft" && record.status !== "collecting_information") || reports.length > 0;
  const title = record.intake.values["respondent.name"]?.value;
  const opened = formatDate(record.createdAt.slice(0, 10));

  async function buildReport() {
    if (record.status === "awaiting_user_confirmation") {
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBuilding(true);
    try {
      const r = await api<{ case: CaseRecord }>(`/api/cases/${record.id}/intake`, {
        method: "PATCH",
        body: { action: "review" },
      });
      update((w) => ({ ...w, case: r.case }));
      requestAnimationFrame(() =>
        reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/cases">{t("nav.cases")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono">{record.reference}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
            {isDemoCase(record) && <SampleTag />}
            <span className="font-mono">{record.reference}</span>
            <span aria-hidden>·</span>
            <span>{t("case.opened", { n: opened })}</span>
            <StatusBadge status={record.status} />
          </div>
          <h1 className="font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[34px]">
            {title ? String(title) : t("case.untitled")}
          </h1>
          {summaryLine(t, record) && (
            <p className="text-[15px] text-ink-2">{summaryLine(t, record)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setTab("report")}>
            <MessageSquare aria-hidden /> {t("case.askManya")}
          </Button>
          {latest && (
            <Button asChild variant="ink">
              <a href={`/api/download?kind=report&case=${record.id}&id=${latest.id}`}>
                <Download aria-hidden /> {t("case.reportPdf")}
              </a>
            </Button>
          )}
        </div>
      </header>

      <StageProgress stage={stage} />

      <div
        role="tablist"
        aria-label={record.reference}
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1"
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`tab-${name}`}
            aria-selected={current === name}
            aria-controls={`panel-${name}`}
            onClick={() => setTab(name)}
            onKeyDown={(e) => {
              const i = TABS.indexOf(name);
              const next =
                e.key === "ArrowRight"
                  ? TABS[(i + 1) % TABS.length]
                  : e.key === "ArrowLeft"
                    ? TABS[(i - 1 + TABS.length) % TABS.length]
                    : null;
              if (next) {
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            tabIndex={current === name ? 0 : -1}
            className={cn(
              "-mb-px h-11 shrink-0 border-b-2 px-3 text-[15px] font-medium transition-colors",
              current === name
                ? "border-brand-700 text-ink"
                : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {t(TAB_LABEL[name])}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`}>
        {current === "overview" && <Overview workspace={workspace} />}
        {current === "evidence" && (
          <EvidencePanel record={record} documents={documents} update={update} />
        )}
        {current === "report" && (
          <div className="flex flex-col gap-6">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_var(--case-file-panel)]">
              <IntakeChat record={record} messages={messages} update={update} />
              <CaseFilePanel
                record={record}
                documents={documents}
                flags={flags}
                reported={reports.length > 0}
                building={building}
                onAddEvidence={() => setTab("evidence")}
                onBuildReport={() => void buildReport()}
              />
            </div>
            {showReview && (
              <div ref={reviewRef} className="scroll-mt-6">
                <ReviewPanel record={record} reports={reports} update={update} />
              </div>
            )}
          </div>
        )}
        {current === "resolve" && (
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
    <div className="mx-auto w-full max-w-[var(--content-max)]">
      <RequireProfile>{() => <CaseWorkspace id={id} />}</RequireProfile>
    </div>
  );
}

"use client";

import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, Pencil } from "lucide-react";
import { useState } from "react";

import type { CaseRecord, Report } from "@/lib/cases/types";
import type { MessageKey } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import { displayValue, formatDate } from "@/lib/intake/display";
import { FIELDS, type FieldKey, type FieldSpec, type Stage } from "@/lib/intake/fields";
import { missingRequired } from "@/lib/intake/progress";

import { CaseSummary } from "./case-summary";
import { api } from "./client-api";
import type { WorkspaceUpdate } from "./workspace-types";

/** Stage 6 shows the report the way the conversation collected it. */
const GROUP_TITLES: [MessageKey, Stage[]][] = [
  ["review.groupParties", ["parties"]],
  ["review.groupTransaction", ["transaction", "events"]],
  ["review.groupAgreement", ["agreement"]],
  ["review.groupOutcome", ["outcome"]],
];
const REVIEW_GROUPS = GROUP_TITLES.map(([title, stages]) => ({
  title,
  fields: (FIELDS as readonly FieldSpec[]).filter(
    (f) => stages.includes(f.stage) && !f.extractOnly,
  ),
}));

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Editor({
  spec,
  value,
  onSave,
  onCancel,
}: {
  spec: FieldSpec;
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(value);
  const label = t(`field.${spec.key}`);
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      {spec.kind === "choice" ? (
        <select
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={input}
        >
          <option value="">{t("review.notProvided")}</option>
          {spec.choices?.map((c) => (
            <option key={c} value={c}>
              {t(`choice.${spec.key}.${c}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          type={spec.kind === "date" ? "date" : spec.kind === "phone" ? "tel" : "text"}
          inputMode={spec.kind === "amount" ? "numeric" : undefined}
          maxLength={300}
          className={input}
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="rounded-lg bg-brand-800 px-3 py-2 text-sm font-semibold text-white"
        >
          {t("review.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted"
        >
          {t("review.cancel")}
        </button>
      </div>
    </div>
  );
}

/** PRD 4.8: show the whole report, let the trader edit and confirm, then create the PDF. */
export function ReviewPanel({
  record,
  reports,
  update,
}: {
  record: CaseRecord;
  reports: Report[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { intake } = record;
  const missing = missingRequired(intake);
  const canGenerate = record.status === "awaiting_user_confirmation";

  async function save(key: FieldKey, value: string) {
    setError(null);
    try {
      const r = await api<{ case: CaseRecord }>(`/api/cases/${record.id}/intake`, {
        method: "PATCH",
        body: { edits: { [key]: value } },
      });
      update((w) => ({ ...w, case: r.case }));
      setEditing(null);
      setConfirmed(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ case: CaseRecord; report: Report }>(`/api/cases/${record.id}/report`, {
        body: { confirmed: true },
      });
      update((w) => ({ ...w, case: r.case, reports: [r.report, ...w.reports] }));
      setConfirmed(false);
    } catch {
      setError(t("review.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="review-title"
      className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id="review-title" className="font-display text-2xl font-semibold text-brand-900">
        <p className="mt-1 text-sm text-muted">
          {t("review.accurate")} {t("review.body")}
        </p>
      </h2>
      <p className="mt-1 text-sm text-muted">{t("review.body")}</p>

      <div className="mt-4">
        <CaseSummary key={record.updatedAt} caseId={record.id} />
      </div>

      {intake.narrative && (
        <blockquote className="mt-4 rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-900">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {t("review.narrative")}
          </p>
          “{intake.narrative}”
        </blockquote>
      )}

      <div className="mt-5 space-y-5" data-testid="report-fields">
        {REVIEW_GROUPS.map((group) => (
          <section key={group.title} aria-label={t(group.title)}>
            <h3 className="text-sm font-semibold text-brand-800">{t(group.title)}</h3>
            <dl className="mt-1 divide-y divide-line">
              {group.fields.map((spec) => {
                const key = spec.key;
                const field = intake.values[key];
                const unknown = intake.unknown.includes(key);
                const required = spec.need === "required";
                return (
                  <div key={key} className="py-3" data-field={key}>
                    <dt className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      <span>
                        {t(`field.${key}`)}
                        {required && <span aria-hidden> *</span>}
                      </span>
                      {editing !== key && (
                        <button
                          type="button"
                          onClick={() => setEditing(key)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-700 normal-case tracking-normal hover:bg-brand-50"
                        >
                          <Pencil className="size-3.5" aria-hidden /> {t("review.edit")}
                          <span className="sr-only"> {t(`field.${key}`)}</span>
                        </button>
                      )}
                    </dt>
                    <dd className="mt-1">
                      {editing === key ? (
                        <Editor
                          spec={spec}
                          value={field ? String(field.value) : ""}
                          onSave={(v) => void save(key, v)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : field ? (
                        <>
                          <span className="text-base font-medium text-ink">
                            {displayValue(t, key, field)}
                          </span>
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                            {field.confirmed && (
                              <CheckCircle2 className="size-3 text-emerald-600" aria-hidden />
                            )}
                            {t(`provenance.${field.source}`)}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`text-sm italic ${required && !unknown ? "text-gold-700" : "text-muted"}`}
                        >
                          {unknown ? t("review.unknown") : t("review.notProvided")}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
        {(intake.events ?? []).length > 0 && (
          <section aria-label={t("review.events")}>
            <h3 className="text-sm font-semibold text-brand-800">{t("review.events")}</h3>
            <ol
              className="mt-2 space-y-1.5 border-l-2 border-brand-100 pl-4 text-sm"
              data-testid="review-events"
            >
              {(intake.events ?? []).map((ev) => (
                <li key={`${ev.date}-${ev.text}`}>
                  <span className="font-semibold text-brand-700">
                    {ev.date ? formatDate(ev.date) : t("evidence.undated")}
                  </span>{" "}
                  {ev.text}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {canGenerate && (
        <div className="mt-5 space-y-4 rounded-2xl border border-gold-200 bg-gold-50 p-4">
          {missing.length > 0 && (
            <p className="flex gap-2 text-sm text-gold-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
              {t("review.missingRequired")}
            </p>
          )}
          <label className="flex items-start gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-5 accent-brand-700"
            />
            {t("review.confirm")}
          </label>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={!confirmed || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <FileText className="size-4" aria-hidden />
            )}
            {busy ? t("review.generating") : t("review.generate")}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {reports.length > 0 && (
        <div className="mt-5 space-y-2">
          {record.status === "report_generated" && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-4" aria-hidden /> {t("review.generated")}
            </p>
          )}
          {reports.map((r) => (
            <a
              key={r.id}
              href={`/api/download?kind=report&case=${record.id}&id=${r.id}`}
              className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              <Download className="size-4" aria-hidden /> {t("review.download", { n: r.version })}
            </a>
          ))}
        </div>
      )}

      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">
        {t("review.disclaimer")}
      </p>
    </section>
  );
}

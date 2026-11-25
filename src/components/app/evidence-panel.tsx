"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileUp,
  Fingerprint,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  type CaseRecord,
  DOCUMENT_CATEGORIES,
  type DocumentExtraction,
  type EvidenceDocument,
} from "@/lib/cases/types";
import { DEMO_FILES } from "@/lib/demo/cases";
import { type ConsistencyFlag, checkConsistency } from "@/lib/evidence/consistency";
import { useT } from "@/lib/i18n/use-t";
import { formatDate } from "@/lib/intake/display";
import { chronology } from "@/lib/report/chronology";

import { api } from "./client-api";
import type { WorkspaceUpdate } from "./workspace-types";

const input =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

const FIELDS = [
  ["documentType", "doc.documentType", "text"],
  ["date", "doc.date", "date"],
  ["amount", "doc.amount", "number"],
  ["currency", "doc.currency", "text"],
  ["reference", "doc.reference", "text"],
  ["sender", "doc.sender", "text"],
  ["recipient", "doc.recipient", "text"],
] as const;

/** Upload control shared by the case workspace and the Business Vault. */
export function UploadButton({
  caseId,
  onUploaded,
}: { caseId: string | null; onUploaded: (d: EvidenceDocument) => void }) {
  const t = useT();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (caseId) form.append("caseId", caseId);
    try {
      const { document } = await api<{ document: EvidenceDocument }>("/api/documents", { form });
      onUploaded(document);
    } catch (e) {
      setError((e as Error).message || t("evidence.error"));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-800 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 has-[:disabled]:opacity-60">
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileUp className="size-4" aria-hidden />
        )}
        {busy ? t("evidence.uploading") : t("evidence.upload")}
        <input
          ref={ref}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-3">{t("evidence.types")}</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Flag({ flag }: { flag: ConsistencyFlag }) {
  const t = useT();
  return (
    <div
      data-testid="consistency-flag"
      className="rounded-xl border border-gold-300 bg-gold-50 p-3 text-sm text-gold-700"
    >
      <p className="flex gap-2 font-semibold">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
        {t(`consistency.${flag.kind}`)}
      </p>
      <p className="mt-1 pl-6">
        {t("consistency.reportSays", { n: flag.reportValue })} ·{" "}
        {t("consistency.documentSays", { n: flag.documentValue })}
      </p>
      <p className="mt-1 pl-6 text-xs">{t("consistency.note")}</p>
    </div>
  );
}

export function DocumentCard({
  doc,
  flags,
  onChange,
}: {
  doc: EvidenceDocument;
  flags: ConsistencyFlag[];
  onChange: (d: EvidenceDocument) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e = doc.extraction;

  async function save(form: FormData) {
    setBusy(true);
    setError(null);
    const str = (k: string) => {
      const v = String(form.get(k) ?? "").trim();
      return v === "" ? null : v;
    };
    const amount = str("amount");
    const extraction: DocumentExtraction = {
      documentType: str("documentType"),
      date: str("date"),
      amount: amount ? Number(amount.replace(/[,\s]/g, "")) : null,
      currency: str("currency"),
      reference: str("reference"),
      sender: str("sender"),
      recipient: str("recipient"),
      description: e?.description ?? null,
    };
    try {
      const r = await api<{ document: EvidenceDocument }>(`/api/documents/${doc.id}`, {
        method: "PATCH",
        body: { category: String(form.get("category")), extraction, confirm: true },
      });
      onChange(r.document);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      data-testid="evidence-card"
      className="rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{doc.filename}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <Fingerprint className="size-3" aria-hidden />{" "}
              {t("evidence.integrity", { n: doc.sha256.slice(0, 12) })}
            </span>
            <span className="inline-flex items-center gap-1 text-gold-700">
              <ShieldAlert className="size-3" aria-hidden /> {t("evidence.notVerified")}
            </span>
          </p>
        </div>
        <a
          href={`/api/download?kind=document&id=${doc.id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
        >
          {t("evidence.open")} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </header>

      {flags.length > 0 && (
        <div className="mt-3 space-y-2">
          {flags.map((f) => (
            <Flag key={f.kind} flag={f} />
          ))}
        </div>
      )}

      <p
        className={`mt-3 text-xs font-semibold ${doc.userConfirmed ? "text-success" : "text-gold-700"}`}
      >
        {doc.userConfirmed ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" aria-hidden /> {t("evidence.confirmed")}
          </span>
        ) : doc.verification.informationExtraction === "failed" ? (
          t("evidence.extractionFailed")
        ) : doc.category === "unknown" ? (
          t("evidence.lowConfidence")
        ) : (
          t("evidence.unconfirmed")
        )}
      </p>

      <form
        action={save}
        className="mt-3 grid gap-3 sm:grid-cols-2"
        key={`${doc.id}-${doc.userConfirmed}`}
      >
        <label className="text-xs font-semibold text-ink-3 sm:col-span-2">
          {t("evidence.category")}
          <select name="category" defaultValue={doc.category} className={input}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
        </label>
        {FIELDS.map(([name, label, type]) => {
          const value = e?.[name];
          return (
            <label key={name} className="text-xs font-semibold text-ink-3">
              {t(label)}
              <input
                name={name}
                type={type === "number" ? "text" : type}
                inputMode={type === "number" ? "numeric" : undefined}
                defaultValue={value === null || value === undefined ? "" : String(value)}
                className={input}
              />
            </label>
          );
        })}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}{" "}
            {t("evidence.confirm")}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </form>
    </article>
  );
}

/** PRD module 2 (Organise): upload, read, confirm, and check against the report. */
export function EvidencePanel({
  record,
  documents,
  update,
}: {
  record: CaseRecord;
  documents: EvidenceDocument[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  const flags = checkConsistency(record.intake, documents);
  const timeline = chronology(t, record.intake, documents);
  const replace = (d: EvidenceDocument) =>
    update((w) => ({ ...w, documents: w.documents.map((x) => (x.id === d.id ? d : x)) }));

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-2xl font-semibold text-brand-900">
          {t("evidence.title")}
        </h2>
        <p className="mt-1 text-sm text-ink-3">{t("evidence.body")}</p>
        <div className="mt-4">
          <UploadButton
            caseId={record.id}
            onUploaded={(d) => update((w) => ({ ...w, documents: [...w.documents, d] }))}
          />
        </div>
        <details className="mt-3 text-xs text-ink-3">
          <summary className="cursor-pointer font-semibold text-brand-700">
            {t("evidence.samples")}
          </summary>
          <ul className="mt-2 space-y-1">
            {DEMO_FILES.map((file) => (
              <li key={file}>
                <a href={`/demo/${file}`} download className="text-brand-700 underline">
                  {file}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-1">{t("demo.note")}</p>
        </details>
        {!record.intake.values["transaction.amount"] && (
          <p className="mt-3 text-xs text-ink-3">{t("evidence.reportFirst")}</p>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-ink-3">
          {t("evidence.empty")}
        </p>
      ) : (
        documents.map((d) => (
          <DocumentCard
            key={d.id}
            doc={d}
            flags={flags.filter((f) => f.documentId === d.id)}
            onChange={replace}
          />
        ))
      )}

      {timeline.length > 0 && (
        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-ink">{t("evidence.timeline")}</h3>
          <ol className="mt-3 space-y-3 border-l-2 border-brand-100 pl-4">
            {timeline.map((ev) => (
              <li key={`${ev.date}-${ev.text}`} className="text-sm">
                <span className="block text-xs font-semibold text-brand-700">
                  {ev.date ? formatDate(ev.date) : t("evidence.undated")}
                </span>
                {ev.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

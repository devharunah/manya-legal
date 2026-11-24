"use client";

import { Download, Handshake, Loader2, Lock } from "lucide-react";
import { useState } from "react";

import { PROVIDERS, providerById } from "@/data/providers";
import type {
  CaseRecord,
  EvidenceDocument,
  Referral,
  Report,
  ShareSelection,
} from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";
import { formatDate } from "@/lib/intake/display";
import { type Pathway, type PathwayType, pathways } from "@/lib/resolve/pathways";

import { api } from "./client-api";
import { LawSources } from "./law-sources";
import { ProviderCard } from "./provider-card";
import type { WorkspaceUpdate } from "./workspace-types";

function PathwayCard({ p, onPrepare }: { p: Pathway; onPrepare: (p: PathwayType) => void }) {
  const t = useT();
  const providers = p.providerIds.flatMap((id) => PROVIDERS.filter((x) => x.id === id));
  return (
    <article
      data-testid={`pathway-${p.type}`}
      className="space-y-3 rounded-3xl border border-line bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-semibold text-brand-900">
          {t(`pathway.${p.type}.title`)}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
            p.status === "potential_option"
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-gold-50 text-gold-700 ring-gold-200"
          }`}
        >
          {t(`resolve.status.${p.status}`)}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("resolve.why")}
        </p>
        {p.why.map((line) => (
          <p key={line.key} className="mt-1 text-sm leading-6 text-ink">
            {t(line.key, line.n === undefined ? undefined : { n: line.n })}
          </p>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("resolve.steps")}
        </p>
        {p.steps.map((line) => (
          <p key={line.key} className="mt-1 text-sm leading-6 text-ink">
            {t(line.key)}
          </p>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("resolve.check")}
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {p.check.map((line) => (
            <li key={line.key} className="text-sm leading-6 text-ink">
              {t(line.key)}
            </li>
          ))}
        </ul>
      </div>
      {p.chunkIds.length > 0 ? (
        <LawSources chunkIds={p.chunkIds} />
      ) : (
        <p className="text-xs text-muted">{t("resolve.agreementSource")}</p>
      )}
      {providers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("resolve.providers")}
          </p>
          {providers.map((prov) => (
            <ProviderCard key={prov.id} provider={prov} compact />
          ))}
          <button
            type="button"
            onClick={() => onPrepare(p.type)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800"
          >
            <Handshake className="size-4" aria-hidden /> {t("resolve.prepare")}
          </button>
        </div>
      )}
    </article>
  );
}

function ReferralForm({
  record,
  pathway,
  documents,
  onDone,
  onCancel,
}: {
  record: CaseRecord;
  pathway: PathwayType;
  documents: EvidenceDocument[];
  onDone: (r: Referral) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const options = PROVIDERS.filter((p) => p.pathways.includes(pathway));
  const [providerId, setProviderId] = useState(options[0]?.id ?? "");
  const [shared, setShared] = useState<ShareSelection>({
    report: true,
    documentIndex: true,
    chronology: true,
    contact: false,
    documentIds: [],
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provider = providerById(providerId);

  const toggle = (key: keyof Omit<ShareSelection, "documentIds">) =>
    setShared((s) => ({ ...s, [key]: !s[key] }));
  const toggleDoc = (id: string) =>
    setShared((s) => ({
      ...s,
      documentIds: s.documentIds.includes(id)
        ? s.documentIds.filter((x) => x !== id)
        : [...s.documentIds, id],
    }));

  async function create() {
    if (!consent) {
      setError(t("referral.needConsent"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { referral } = await api<{ referral: Referral }>(`/api/cases/${record.id}/referrals`, {
        body: { providerId, pathway, consent: true, shared },
      });
      onDone(referral);
    } catch {
      setError(t("referral.error"));
    } finally {
      setBusy(false);
    }
  }

  const box = "flex items-start gap-3 text-sm text-ink";
  return (
    <section
      aria-labelledby="referral-title"
      className="space-y-4 rounded-3xl border-2 border-brand-200 bg-white p-5 shadow-sm"
    >
      <h3 id="referral-title" className="font-display text-xl font-semibold text-brand-900">
        {t("referral.title")}
      </h3>
      <p className="flex gap-2 text-sm text-muted">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("referral.body")}
      </p>
      <label className="block text-sm font-semibold text-ink">
        {t("referral.provider")}
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base"
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">{t("referral.include")}</legend>
        {(["report", "documentIndex", "chronology", "contact"] as const).map((key) => (
          <label key={key} className={box}>
            <input
              type="checkbox"
              checked={shared[key]}
              onChange={() => toggle(key)}
              className="mt-0.5 size-5 accent-brand-700"
            />
            {t(key === "documentIndex" ? "referral.index" : `referral.${key}`)}
          </label>
        ))}
      </fieldset>
      {documents.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink">{t("referral.documents")}</legend>
          {documents.map((d) => (
            <label key={d.id} className={box}>
              <input
                type="checkbox"
                checked={shared.documentIds.includes(d.id)}
                onChange={() => toggleDoc(d.id)}
                className="mt-0.5 size-5 accent-brand-700"
              />
              {d.filename}
            </label>
          ))}
        </fieldset>
      )}
      <label className={`${box} rounded-xl bg-gold-50 p-3 font-medium`}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-5 accent-brand-700"
        />
        {t("referral.consent", { n: provider?.name ?? "" })}
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? t("referral.creating") : t("referral.create")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-3 text-sm font-medium text-muted"
        >
          {t("review.cancel")}
        </button>
      </div>
    </section>
  );
}

/** PRD module 3 (Resolve): preliminary options with their law, then a consented referral. */
export function ResolvePanel({
  record,
  reports,
  documents,
  referrals,
  update,
}: {
  record: CaseRecord;
  reports: Report[];
  documents: EvidenceDocument[];
  referrals: Referral[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  const [preparing, setPreparing] = useState<PathwayType | null>(null);
  const report = reports[0];

  if (!report) {
    return (
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-900">{t("resolve.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("resolve.needReport")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-900">{t("resolve.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("resolve.body")}</p>
        <p
          className="mt-3 rounded-xl bg-gold-50 p-3 text-xs leading-5 text-gold-700"
          data-testid="resolve-disclaimer"
        >
          {t("resolve.disclaimer")}
        </p>
      </div>

      {referrals.length > 0 && (
        <div className="space-y-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">{t("referral.ready")}</p>
          {referrals.map((r) => (
            <a
              key={r.id}
              href={`/api/download?kind=referral&case=${record.id}&id=${r.id}`}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-800 shadow-sm"
            >
              <Download className="size-4" aria-hidden /> {t("referral.download")} ·{" "}
              {providerById(r.providerId)?.name ?? r.providerId} ·{" "}
              {formatDate(r.createdAt.slice(0, 10))}
            </a>
          ))}
        </div>
      )}

      {preparing && (
        <ReferralForm
          record={record}
          pathway={preparing}
          documents={documents}
          onCancel={() => setPreparing(null)}
          onDone={(r) => {
            update((w) => ({ ...w, referrals: [...w.referrals, r] }));
            setPreparing(null);
          }}
        />
      )}

      {pathways(report.intake).map((p) => (
        <PathwayCard key={p.type} p={p} onPrepare={setPreparing} />
      ))}
    </section>
  );
}

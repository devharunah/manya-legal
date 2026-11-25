"use client";

import { Download, Handshake, Loader2, Lock } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function PathwayCard({
  p,
  selected,
  onSelect,
  onPrepare,
}: {
  p: Pathway;
  selected: boolean;
  onSelect: () => void;
  onPrepare: (p: PathwayType) => void;
}) {
  const t = useT();
  const providers = p.providerIds.flatMap((id) => PROVIDERS.filter((x) => x.id === id));
  const label = "text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase";
  return (
    <article
      data-testid={`pathway-${p.type}`}
      className={`flex flex-col gap-4 rounded-lg bg-paper p-5 transition-colors ${
        selected
          ? "border-2 border-brand-700 p-[19px]"
          : "border border-line hover:border-line-strong"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="pathway"
          checked={selected}
          onChange={onSelect}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:shadow-[var(--focus-ring)] ${
            selected ? "border-brand-700" : "border-line-strong"
          }`}
        >
          {selected && <span className="size-2.5 rounded-full bg-brand-700" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <span className="font-display text-[19px] leading-tight font-semibold text-ink">
            {t(`pathway.${p.type}.title`)}
          </span>
          <Badge variant={p.status === "potential_option" ? "success" : "warning"}>
            {t(`resolve.status.${p.status}`)}
          </Badge>
        </span>
      </label>
      <div>
        <p className={label}>{t("resolve.why")}</p>
        {p.why.map((line) => (
          <p key={line.key} className="mt-1 text-sm leading-6 text-ink-2">
            {t(line.key, line.n === undefined ? undefined : { n: line.n })}
          </p>
        ))}
      </div>
      <div>
        <p className={label}>{t("resolve.check")}</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {p.check.map((line) => (
            <li key={line.key} className="rounded-md bg-tint px-2.5 py-1.5 text-[13px] text-ink-2">
              {t(line.key)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className={label}>{t("resolve.steps")}</p>
        {p.steps.map((line) => (
          <p key={line.key} className="mt-1 text-sm leading-6 text-ink">
            {t(line.key)}
          </p>
        ))}
      </div>
      <div className="border-t border-line pt-3 text-xs text-ink-3">
        {p.chunkIds.length > 0 ? (
          <LawSources chunkIds={p.chunkIds} />
        ) : (
          <p>{t("resolve.agreementSource")}</p>
        )}
      </div>
      {providers.length > 0 && (
        <div className="flex flex-col gap-2">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md text-sm font-semibold text-brand-700">
              <span aria-hidden className="transition-transform group-open:rotate-90">
                ›
              </span>
              {t("resolve.providers")} ({providers.length})
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {providers.map((prov) => (
                <ProviderCard key={prov.id} provider={prov} compact />
              ))}
            </div>
          </details>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onPrepare(p.type)}
            className="self-start"
          >
            <Handshake aria-hidden /> {t("resolve.prepare")}
          </Button>
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
      className="space-y-4 rounded-xl border border-line bg-paper p-5 shadow-[var(--shadow-1)] sm:p-6"
    >
      <h3 id="referral-title" className="font-display text-[22px] font-semibold text-ink">
        {t("referral.title")}
      </h3>
      <p className="flex gap-2 text-sm text-ink-3">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("referral.body")}
      </p>
      <label className="block text-sm font-semibold text-ink">
        {t("referral.provider")}
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="mt-1.5 block h-12 w-full rounded-md border border-line-strong bg-paper px-3.5 text-base outline-none focus:border-brand-700 focus:shadow-[var(--focus-ring-input)]"
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
      <label className={`${box} rounded-md bg-brand-50 p-3.5 font-medium`}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-5 accent-brand-700"
        />
        {t("referral.consent", { n: provider?.name ?? "" })}
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void create()} disabled={busy}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {busy ? t("referral.creating") : t("referral.create")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("review.cancel")}
        </Button>
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
  const [chosen, setChosen] = useState<PathwayType | null>(null);
  const report = reports[0];

  const routes = report ? pathways(report.intake) : [];
  const selected = routes.find((p) => p.type === chosen) ?? null;

  if (!report) {
    return (
      <section className="rounded-lg border border-line bg-paper p-6">
        <h2 className="font-display text-[22px] font-semibold text-ink">{t("resolve.title")}</h2>
        <p className="mt-2 text-sm text-ink-2">{t("resolve.needReport")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-[22px] leading-7 font-semibold text-ink sm:text-[26px]">
          {t("resolve.pick")}
        </h2>
        <p className="mt-1 text-[15px] text-ink-2">{t("resolve.body")}</p>
        <p
          className="mt-3 rounded-md border border-line bg-paper p-3 text-xs leading-5 text-ink-2"
          data-testid="resolve-disclaimer"
        >
          {t("resolve.disclaimer")}
        </p>
      </div>

      {referrals.length > 0 && (
        <div className="space-y-2 rounded-lg border border-success-bg bg-success-bg p-5">
          <p className="text-sm font-semibold text-success">{t("referral.ready")}</p>
          {referrals.map((r) => (
            <a
              key={r.id}
              href={`/api/download?kind=referral&case=${record.id}&id=${r.id}`}
              className="flex min-h-11 items-center gap-2 rounded-md bg-paper px-4 py-3 text-sm font-semibold text-brand-700"
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

      <fieldset className="grid gap-4 lg:grid-cols-2">
        <legend className="sr-only">{t("resolve.pick")}</legend>
        {routes.map((p) => (
          <PathwayCard
            key={p.type}
            p={p}
            selected={chosen === p.type}
            onSelect={() => setChosen(p.type)}
            onPrepare={setPreparing}
          />
        ))}
      </fieldset>

      {selected && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-ink p-5 text-white">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] text-white/70">{t("resolve.nextStep")}</span>
            <span className="font-display text-[17px] font-semibold">
              {t(`pathway.${selected.type}.title`)}
            </span>
            {selected.steps[0] && (
              <span className="text-sm text-white/85">{t(selected.steps[0].key)}</span>
            )}
          </div>
          {selected.providerIds.length > 0 && (
            <Button
              type="button"
              variant="inverse"
              onClick={() => setPreparing(selected.type)}
              className="w-full sm:w-auto"
            >
              <Handshake aria-hidden /> {t("resolve.prepareChosen")}
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-ink-3">
        {t("resolve.limits")}{" "}
        <a href="/legal-support" className="text-ink-2 underline underline-offset-2">
          {t("footer.sources")}
        </a>
      </p>
    </section>
  );
}

"use client";

import { BadgeCheck, Clock, ExternalLink } from "lucide-react";

import type { Provider } from "@/data/providers";
import { useT } from "@/lib/i18n/use-t";
import { formatDate } from "@/lib/intake/display";

export function ProviderStatusBadge({ status }: { status: Provider["status"] }) {
  const t = useT();
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        verified
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-gold-50 text-gold-700 ring-gold-200"
      }`}
    >
      {verified ? (
        <BadgeCheck className="size-3" aria-hidden />
      ) : (
        <Clock className="size-3" aria-hidden />
      )}
      {t(`provider.${status}`)}
    </span>
  );
}

/** PRD 6.4: who a provider is, what they help with, and how we know. */
export function ProviderCard({
  provider,
  compact = false,
}: { provider: Provider; compact?: boolean }) {
  const t = useT();
  return (
    <article
      data-testid="provider-card"
      className="rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-ink" lang="en">
          {provider.name}
        </h3>
        <ProviderStatusBadge status={provider.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="font-semibold">{t("provider.areas")}:</span> {provider.areas.join(", ")}
      </p>
      {!compact && (
        <>
          <p className="mt-2 text-xs text-muted" lang="en">
            {provider.accreditation}
          </p>
          <p className="mt-2 text-sm text-ink">
            <span className="font-semibold">{t("provider.contact")}:</span> {provider.contact}
          </p>
          <p className="text-sm text-muted">{provider.location}</p>
        </>
      )}
      <p className="mt-2 text-xs text-muted">
        {t("provider.source")}: {provider.verificationSource}.{" "}
        {t("provider.lastChecked", { n: formatDate(provider.lastVerified) })}
      </p>
      <a
        href={provider.website}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
      >
        {t("provider.website")} <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </article>
  );
}

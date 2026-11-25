"use client";

import { ExternalLink } from "lucide-react";

import { ProviderCard } from "@/components/app/provider-card";
import { CurrencyBadge } from "@/components/currency-badge";
import { SOURCES } from "@/data/kb/sources";
import { PROVIDERS } from "@/data/providers";
import { useT } from "@/lib/i18n/use-t";

export default function LegalSupportPage() {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-brand-900">{t("support.title")}</h1>
        <p className="mt-2 text-ink-3">{t("support.body")}</p>
        <p className="mt-1 text-sm text-ink-3">{t("support.noPractitioners")}</p>
      </div>
      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>
      <section id="sources">
        <h2 className="font-display text-2xl font-semibold text-brand-900">
          {t("footer.sources")}
        </h2>
        <ul className="mt-3 space-y-3">
          {SOURCES.map((s) => (
            <li
              key={s.id}
              lang="en"
              className="rounded-2xl border border-line bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{s.shortTitle}</h3>
                <CurrencyBadge currency={s.currency} />
              </div>
              <p className="mt-1 text-sm text-ink-3">{s.title}</p>
              <p className="mt-1 text-xs text-ink-3">
                {s.publisher} · {t("drawer.asAt")}: {s.asOf ?? t("drawer.undated")} ·{" "}
                {s.currencyNote}
              </p>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
              >
                {t("drawer.open")} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";

import type { CitedSource } from "@/lib/answer/types";
import { useT } from "@/lib/i18n/use-t";

import { CurrencyBadge } from "./currency-badge";

export function SourceDrawer({
  source,
  index,
  onClose,
}: {
  source: CitedSource;
  index: number;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none justify-end bg-transparent p-0"
      aria-modal="true"
      aria-labelledby="source-title"
    >
      <button
        type="button"
        aria-label={t("drawer.close")}
        className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="animate-rise relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
              {t("drawer.source", { n: index })}
            </p>
            <h2
              id="source-title"
              className="mt-1 font-display text-xl font-semibold text-brand-900"
            >
              {source.sourceShortTitle}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{source.locator}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-800"
            aria-label={t("drawer.close")}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            <CurrencyBadge currency={source.currency} />
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100 ring-inset">
              {source.textKind === "verbatim" ? t("drawer.exact") : t("drawer.summary")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-ink">{source.heading}</h3>
            <blockquote className="mt-3 border-l-4 border-gold-300 bg-paper py-3 pr-3 pl-4 font-display text-[15px] leading-7 text-ink/90">
              {source.text}
            </blockquote>
          </div>
          <div className="rounded-xl bg-gold-50 p-4 text-sm leading-6 text-gold-700">
            <p className="font-semibold">{t("drawer.stillLaw")}</p>
            <p className="mt-1">{source.currencyNote}</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">{t("drawer.document")}</dt>
            <dd className="text-ink">{source.sourceTitle}</dd>
            <dt className="text-muted">{t("drawer.publisher")}</dt>
            <dd className="text-ink">{source.publisher}</dd>
            <dt className="text-muted">{t("drawer.asAt")}</dt>
            <dd className="text-ink">{source.asOf ?? t("drawer.undated")}</dd>
          </dl>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            {t("drawer.open")} <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
      </aside>
    </dialog>
  );
}

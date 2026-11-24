"use client";

import { BookOpenCheck, ExternalLink } from "lucide-react";

import { CurrencyBadge } from "@/components/currency-badge";
import { CHUNKS } from "@/data/kb/chunks";
import { SOURCES } from "@/data/kb/sources";
import { useT } from "@/lib/i18n/use-t";

/**
 * The law behind a pathway, verbatim and in English (never machine-translated),
 * with where it comes from and whether it is still current.
 */
export function LawSources({ chunkIds }: { chunkIds: string[] }) {
  const t = useT();
  const chunks = chunkIds.flatMap((id) => CHUNKS.filter((c) => c.id === id));
  return (
    <details className="group rounded-xl border border-line bg-paper">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-brand-800">
        <BookOpenCheck className="size-4" aria-hidden /> {t("resolve.sources")} ({chunks.length})
      </summary>
      <div className="space-y-4 border-t border-line px-4 py-4">
        <p className="text-xs text-muted">{t("resolve.lawNotTranslated")}</p>
        {chunks.map((chunk) => {
          const source = SOURCES.find((s) => s.id === chunk.sourceId);
          if (!source) return null;
          const currency = chunk.currency ?? source.currency;
          return (
            <figure key={chunk.id} data-testid="law-excerpt" lang="en">
              <figcaption className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
                {source.shortTitle}, {chunk.locator}
                <CurrencyBadge currency={currency} />
              </figcaption>
              <blockquote className="mt-1.5 border-l-2 border-gold-300 pl-3 text-sm leading-6 text-ink">
                {chunk.text}
              </blockquote>
              <p className="mt-1 text-xs text-muted">{chunk.currencyNote ?? source.currencyNote}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
              >
                {t("drawer.open")} <ExternalLink className="size-3" aria-hidden />
              </a>
            </figure>
          );
        })}
      </div>
    </details>
  );
}

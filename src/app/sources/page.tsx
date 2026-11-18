import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { CurrencyBadge } from "@/components/currency-badge";
import { CHUNKS } from "@/data/kb/chunks";
import { SOURCES } from "@/data/kb/sources";

export const metadata: Metadata = { title: "Our sources | Manya Legal" };

export default function SourcesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">
        Transparency
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
        Every source we answer from
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Manya Legal only answers from this curated library. Each document shows how current it is.
        Law changes, so where our copy is older or a summary, we say so and tell you what to check.
      </p>

      <div className="mt-10 space-y-6">
        {SOURCES.map((source) => {
          const chunks = CHUNKS.filter((c) => c.sourceId === source.id);
          return (
            <section
              key={source.id}
              className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold text-brand-900">
                    {source.shortTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {source.title} · {source.publisher}
                  </p>
                </div>
                <CurrencyBadge currency={source.currency} />
              </div>
              <p className="mt-4 rounded-xl bg-paper p-3 text-sm leading-6 text-ink/80">
                {source.currencyNote}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <span>As at: {source.asOf ?? "undated"}</span>
                <span>Checked: {source.accessed}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900"
                >
                  Official document <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
              <details className="group mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand-800">
                  {chunks.length} provision{chunks.length === 1 ? "" : "s"} in our library
                </summary>
                <ul className="mt-3 divide-y divide-line">
                  {chunks.map((c) => (
                    <li key={c.id} className="py-3">
                      <p className="text-sm font-semibold text-ink">
                        {c.locator}: {c.heading}
                        {c.currency && c.currency !== source.currency && (
                          <span className="ml-2 align-middle">
                            <CurrencyBadge currency={c.currency} />
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">{c.text}</p>
                      {c.currencyNote && (
                        <p className="mt-1 text-xs text-orange-800">{c.currencyNote}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          );
        })}
      </div>
    </main>
  );
}

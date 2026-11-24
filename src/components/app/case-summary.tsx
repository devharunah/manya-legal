"use client";

import { useCompletion } from "@ai-sdk/react";
import { Loader2, RefreshCw, Sparkles, Square } from "lucide-react";
import { useState } from "react";

import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";

/**
 * A streamed, plain-language summary of what the trader reported (Vercel AI
 * SDK useCompletion over a text stream). Clearly marked as AI-written; in
 * Luganda mode the finished English text is machine-translated underneath.
 * The parent keys it by the case version, so an edited report starts fresh.
 */
export function CaseSummary({ caseId }: { caseId: string }) {
  const t = useT();
  const [lang] = useLanguage();
  const [luganda, setLuganda] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [empty, setEmpty] = useState(false);
  const { completion, complete, isLoading, error, stop } = useCompletion({
    api: `/api/cases/${caseId}/summary`,
    streamProtocol: "text",
  });

  async function run() {
    setLuganda(null);
    setEmpty(false);
    const english = await complete("");
    if (!english?.trim()) {
      setEmpty(true);
      return;
    }
    if (lang !== "lug") return;
    setTranslating(true);
    try {
      setLuganda((await api<{ text: string }>("/api/translate", { body: { text: english } })).text);
    } catch {
      setLuganda(null);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <section
      aria-labelledby="summary-title"
      data-testid="case-summary"
      className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="summary-title" className="flex items-center gap-2 font-semibold text-brand-900">
          <Sparkles className="size-4 text-gold-600" aria-hidden /> {t("summary.title")}
        </h3>
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:text-brand-800"
          >
            <Square className="size-3.5 fill-current" aria-hidden /> {t("summary.stop")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void run()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {completion ? (
              <RefreshCw className="size-3.5" aria-hidden />
            ) : (
              <Sparkles className="size-3.5" aria-hidden />
            )}
            {completion ? t("summary.again") : t("summary.create")}
          </button>
        )}
      </div>

      {(completion || isLoading) && (
        <p
          lang="en"
          className="mt-3 text-[15px] leading-7 text-ink"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {completion}
          {isLoading && (
            <span
              className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-brand-600 align-middle"
              aria-hidden
            />
          )}
          {isLoading && !completion && <span className="text-muted">{t("summary.writing")}</span>}
        </p>
      )}
      {translating && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {t("summary.translating")}
        </p>
      )}
      {luganda && (
        <p lang="lg" className="mt-3 border-t border-brand-100 pt-3 text-[15px] leading-7 text-ink">
          {luganda}
        </p>
      )}
      {(error || empty) && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {t("summary.error")}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        {completion ? t("summary.notice") : t("summary.body")}
      </p>
    </section>
  );
}

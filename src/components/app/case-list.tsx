"use client";

import { ChevronRight, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { CaseRecord } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";
import { formatAmount } from "@/lib/intake/display";
import { completion } from "@/lib/intake/progress";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";

export function useCases() {
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ cases: CaseRecord[] }>("/api/cases")
      .then((r) => setCases(r.cases))
      .catch((e: Error) => setError(e.message));
  }, []);
  return { cases, error };
}

export function StatusPill({ status }: { status: CaseRecord["status"] }) {
  const t = useT();
  const tone =
    status === "report_generated" || status === "completed"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "awaiting_user_confirmation"
        ? "bg-gold-50 text-gold-700 ring-gold-200"
        : "bg-brand-50 text-brand-800 ring-brand-200";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function NewCaseButton({ className = "" }: { className?: string }) {
  const t = useT();
  const [lang] = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { case: created } = await api<{ case: CaseRecord }>("/api/cases", {
        body: { language: lang },
      });
      router.push(`/cases/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 font-semibold text-brand-950 shadow-sm transition hover:bg-gold-300 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        {t("dashboard.newButton")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

export function CaseList({ cases, empty }: { cases: CaseRecord[]; empty: string }) {
  const t = useT();
  if (cases.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">{empty}</p>
    );
  return (
    <ul className="space-y-3">
      {cases.map((c) => {
        const v = c.intake.values;
        const amount = v["transaction.amount"];
        const currency = v["transaction.currency"]?.value ?? "";
        const supplier = v["respondent.name"]?.value;
        return (
          <li key={c.id}>
            <Link
              href={`/cases/${c.id}`}
              data-testid="case-row"
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-300"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-brand-700">
                    {c.reference}
                  </span>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-1 truncate font-semibold text-ink">
                  {supplier ? String(supplier) : t("cases.unnamed")}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {amount && typeof amount.value === "number"
                    ? `${currency} ${formatAmount(amount.value)} · `
                    : ""}
                  {t("case.progressReport")} {completion(c.intake)}%
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-label={t("cases.open")} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { CheckCircle2, History, Info } from "lucide-react";

import type { MessageKey } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import type { Currency } from "@/lib/kb/types";

const STYLES: Record<Currency, { label: MessageKey; className: string; Icon: typeof Info }> = {
  current: {
    label: "currency.current",
    className: "bg-success-bg text-success ring-success-bg",
    Icon: CheckCircle2,
  },
  secondary: {
    label: "currency.secondary",
    className: "bg-gold-50 text-gold-700 ring-gold-200",
    Icon: Info,
  },
  historical: {
    label: "currency.historical",
    className: "bg-warning-bg-2 text-warning-text ring-warning-line",
    Icon: History,
  },
};

export function CurrencyBadge({ currency }: { currency: Currency }) {
  const t = useT();
  const { label, className, Icon } = STYLES[currency];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3" aria-hidden />
      {t(label)}
    </span>
  );
}

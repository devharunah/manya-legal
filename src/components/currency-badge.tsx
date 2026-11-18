import { CheckCircle2, History, Info } from "lucide-react";

import type { Currency } from "@/lib/kb/types";

const STYLES: Record<Currency, { label: string; className: string; Icon: typeof Info }> = {
  current: {
    label: "Current guidance",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Icon: CheckCircle2,
  },
  secondary: {
    label: "Official summary. Confirm",
    className: "bg-gold-50 text-gold-700 ring-gold-200",
    Icon: Info,
  },
  historical: {
    label: "Older text, may be outdated",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
    Icon: History,
  },
};

export function CurrencyBadge({ currency }: { currency: Currency }) {
  const { label, className, Icon } = STYLES[currency];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

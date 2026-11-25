"use client";

import { Check, FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CaseRecord, EvidenceDocument } from "@/lib/cases/types";
import type { ConsistencyFlag, FlagKind } from "@/lib/evidence/consistency";
import { useT } from "@/lib/i18n/use-t";
import { displayValue } from "@/lib/intake/display";
import type { FieldKey } from "@/lib/intake/fields";
import { cn } from "@/lib/utils";

/** The facts the design's Case file tracks, in order. */
const ROWS: { key: FieldKey; label: string; optional?: boolean }[] = [
  { key: "respondent.name", label: "file.supplier" },
  { key: "transaction.amount", label: "file.amount" },
  { key: "transaction.date", label: "file.date" },
  { key: "transaction.payment_method", label: "file.paidBy" },
  { key: "transaction.goods", label: "file.goods" },
  { key: "respondent.phone", label: "file.phone", optional: true },
];

/** Which report field a document mismatch is about. */
const FLAG_FIELD: Record<FlagKind, FieldKey> = {
  amount: "transaction.amount",
  currency: "transaction.amount",
  date: "transaction.date",
  respondent: "respondent.name",
};

type Dot = "ok" | "flag" | "missing";

function StatusDot({ state }: { state: Dot }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full text-[11px] font-bold",
        state === "ok" && "bg-success-bg text-success",
        state === "flag" && "bg-warning-bg text-warning-text",
        state === "missing" && "bg-tint",
      )}
    >
      {state === "ok" ? (
        <Check className="size-3" strokeWidth={3} />
      ) : state === "flag" ? (
        "!"
      ) : null}
    </span>
  );
}

/**
 * Design: Case file panel. It fills in as the trader chats, from the case's
 * own structured fields; a "!" marks a field an uploaded document disagrees with.
 */
export function CaseFilePanel({
  record,
  documents,
  flags,
  reported,
  onAddEvidence,
  onBuildReport,
  building,
}: {
  record: CaseRecord;
  documents: EvidenceDocument[];
  flags: ConsistencyFlag[];
  /** A report already exists. */
  reported: boolean;
  onAddEvidence: () => void;
  onBuildReport: () => void;
  building: boolean;
}) {
  const t = useT();
  const values = record.intake.values;
  const flagged = new Set(flags.map((f) => FLAG_FIELD[f.kind]));

  const rows = ROWS.map(({ key, label, optional }) => {
    const field = values[key];
    const unknown = record.intake.unknown.includes(key);
    let value = field ? displayValue(t, key, field) : null;
    if (field && key === "transaction.amount") {
      value = `${values["transaction.currency"]?.value ?? ""} ${value}`.trim();
    }
    const state: Dot = !field ? "missing" : flagged.has(key) ? "flag" : "ok";
    return {
      key,
      label: t(label as Parameters<typeof t>[0]) + (optional ? ` · ${t("file.optional")}` : ""),
      value: value ?? (unknown ? t("review.unknown") : t("file.missing")),
      state,
    };
  });
  const filled = rows.filter((r) => r.state !== "missing").length;

  return (
    <aside aria-label={t("file.title")} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-[17px] font-semibold text-ink">{t("file.title")}</h2>
        <p className="text-[13px] text-ink-3">
          {t("file.subtitle")} · {filled}/{rows.length}
        </p>
      </div>
      <ul className="overflow-hidden rounded-lg border border-line bg-paper">
        {rows.map((r) => (
          <li
            key={r.key}
            data-field={r.key}
            className="flex items-start gap-3 border-t border-line px-3.5 py-[11px] first:border-t-0"
          >
            <StatusDot state={r.state} />
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-ink-3">{r.label}</span>
              <span
                className={cn(
                  "text-sm font-medium break-words",
                  r.state === "missing" ? "font-normal text-ink-3" : "text-ink",
                )}
              >
                {r.value}
              </span>
              {r.state === "flag" && <span className="sr-only">{t("file.flagged")}</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[15px] font-semibold text-ink">{t("file.evidence")}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddEvidence}
            className="h-9 text-brand-700"
          >
            <Plus aria-hidden /> {t("file.add")}
          </Button>
        </div>
        {documents.length === 0 ? (
          <p className="text-[13px] text-ink-3">{t("file.noEvidence")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((d) => {
              const mismatch = flags.some((f) => f.documentId === d.id);
              return (
                <li key={d.id} className="flex items-center gap-2.5 text-sm">
                  <FileText
                    className="size-[18px] shrink-0 text-ink-2"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{d.filename}</span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      mismatch ? "text-warning" : d.userConfirmed ? "text-success" : "text-ink-2",
                    )}
                  >
                    {mismatch
                      ? t("file.mismatch")
                      : d.userConfirmed
                        ? t("file.confirmed")
                        : t("file.toCheck")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!reported && (
        <Button
          type="button"
          size="lg"
          onClick={onBuildReport}
          disabled={building}
          className="w-full"
        >
          {t("file.build")}
        </Button>
      )}
    </aside>
  );
}

"use client";

import { Check } from "lucide-react";

import { CASE_STAGES, type StageState } from "@/lib/cases/stage";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";

const LABEL = {
  report: "case.tabReport",
  organise: "case.tabOrganise",
  resolve: "case.tabResolve",
} as const;

/**
 * Report → Organise → Resolve (design: Stage progress). Done stages show a
 * full bar and a tick, the current one a partial bar and brand label,
 * upcoming ones a grey bar. `compact` shows bars only (cards, phones).
 */
export function StageProgress({
  stage,
  compact = false,
  className,
}: {
  stage: StageState;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const at = stage.current === null ? CASE_STAGES.length : CASE_STAGES.indexOf(stage.current);
  return (
    <ol
      aria-label={t("stage.label")}
      className={cn("grid grid-cols-3", compact ? "gap-1.5" : "gap-2", className)}
    >
      {CASE_STAGES.map((name, i) => {
        const done = i < at;
        const current = i === at;
        const fill = done ? 100 : current ? stage.progress : 0;
        return (
          <li
            key={name}
            aria-current={current ? "step" : undefined}
            className="flex flex-col gap-2"
          >
            <span
              aria-hidden
              className={cn("rounded-[3px]", compact ? "h-1.5" : "h-1.5")}
              style={{
                background: `linear-gradient(90deg, var(--brand-700) ${fill}%, var(--line) ${fill}%)`,
              }}
            />
            <span
              className={cn(
                "flex items-center gap-1.5 text-[13px]",
                compact && "sr-only",
                done && "font-medium text-ink",
                current && "font-semibold text-brand-700",
                !done && !current && "text-ink-3",
              )}
            >
              {done && <Check className="size-4 text-brand-700" strokeWidth={2.5} aria-hidden />}
              {t(LABEL[name])}
              {current && stage.detail ? ` · ${stage.detail}` : ""}
              {done && <span className="sr-only"> ({t("stage.done")})</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** 4-step progress for the report focus flow (bars 4px). */
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  const t = useT();
  return (
    <ol
      aria-label={t("stage.steps")}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((label, i) => (
        <li
          key={label}
          aria-current={i === current ? "step" : undefined}
          className="flex flex-col gap-2"
        >
          <span
            aria-hidden
            className={cn("h-1 rounded-[2px]", i <= current ? "bg-brand-700" : "bg-line")}
          />
          <span
            className={cn(
              "flex items-center gap-1 text-xs sm:text-[13px]",
              i < current && "font-medium text-ink",
              i === current && "font-semibold text-brand-700",
              i > current && "text-ink-3",
            )}
          >
            {i < current && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

import { AlertCircle } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Label → input → help or error (design: Field). The control is a render
 * function so it gets the id and the aria wiring.
 */
export function Field({
  label,
  optional,
  help,
  error,
  className,
  children,
}: {
  label: string;
  /** Text appended to the label, e.g. "optional". */
  optional?: string;
  help?: string;
  error?: string | null;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || help;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-3"> · {optional}</span>}
      </label>
      {children({
        id,
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(note ? { "aria-describedby": noteId } : {}),
      })}
      {error ? (
        <p id={noteId} role="alert" className="flex items-center gap-1.5 text-[13px] text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : help ? (
        <p id={noteId} className="text-[13px] text-ink-3">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Input with a fixed prefix cell, e.g. "+256" or "UGX" (design: prefix fields). */
export function PrefixInput({
  prefix,
  className,
  ...props
}: React.ComponentProps<"input"> & { prefix: string }) {
  return (
    <div
      className={cn(
        "flex h-12 overflow-hidden rounded-md border border-line-strong bg-paper transition-[border-color,box-shadow] focus-within:border-brand-700 focus-within:shadow-[var(--focus-ring-input)] has-[[aria-invalid=true]]:border-danger",
        className,
      )}
    >
      <span className="grid place-items-center border-r border-line px-3 font-mono text-sm font-medium text-ink-3">
        {prefix}
      </span>
      <input
        {...props}
        className="min-w-0 flex-1 bg-transparent px-3.5 font-mono text-base text-ink outline-none placeholder:text-placeholder focus-visible:shadow-none"
      />
    </div>
  );
}

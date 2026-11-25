import { cn } from "@/lib/utils";
import type * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Design: Field input. 48px (forms), radius 10, 16px text (no iOS zoom).
        "h-12 w-full min-w-0 rounded-md border border-line-strong bg-paper px-3.5 text-base text-ink transition-[border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-placeholder disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-ink-3",
        "focus-visible:border-brand-700 focus-visible:shadow-[var(--focus-ring-input)]",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

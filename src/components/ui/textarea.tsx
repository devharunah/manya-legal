import { cn } from "@/lib/utils";
import type * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-line-strong bg-paper px-3.5 py-2.5 text-base text-ink transition-[border-color,box-shadow] outline-none placeholder:text-placeholder focus-visible:border-brand-700 focus-visible:shadow-[var(--focus-ring-input)] disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-ink-3 aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

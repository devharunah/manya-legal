import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

/**
 * Status badge (handoff/component-mapping.md → Status badge and SAMPLE tag).
 * Status is always colour plus a word, never colour alone.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning-text",
        neutral: "bg-tint text-ink-2",
        danger: "bg-danger-bg text-danger",
        brand: "bg-brand-100 text-brand-700",
        ink: "bg-ink text-white",
        sample:
          "rounded-xs bg-tint px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-ink-2 uppercase",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

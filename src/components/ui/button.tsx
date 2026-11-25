import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

/**
 * MANYA button (handoff/component-mapping.md → Button). One brand-filled
 * button per view region. Heights: default 44, sm 40, lg 48, xl 54 (landing).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-100 outline-none focus-visible:shadow-[var(--focus-ring)] active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-brand-600 active:bg-brand-900 disabled:bg-disabled-bg disabled:text-disabled-fg",
        secondary:
          "border border-line-strong bg-paper font-medium text-ink hover:bg-canvas active:border-muted-fg active:bg-tint disabled:border-line disabled:text-muted-fg",
        ink: "bg-ink text-white hover:bg-ink-hover active:bg-black disabled:bg-disabled-bg disabled:text-disabled-fg",
        ghost: "font-medium text-ink-2 hover:bg-tint hover:text-ink disabled:text-ink-3",
        destructive:
          "bg-danger text-white hover:bg-danger-hover active:bg-danger-active disabled:bg-danger-bg disabled:text-danger-line",
        inverse: "bg-white text-brand-900 hover:bg-white/90",
        "outline-inverse": "border border-white/35 bg-transparent text-white hover:bg-white/8",
        chip: "h-9 rounded-full border border-line-strong bg-paper px-3.5 text-sm font-medium text-ink hover:border-brand-700 hover:text-brand-700 aria-pressed:border-brand-700 aria-pressed:bg-brand-700 aria-pressed:text-white",
        "quick-reply":
          "h-9 rounded-full border border-brand-700 bg-paper px-3.5 text-sm font-medium text-brand-700 hover:bg-brand-50",
        link: "h-auto px-0 font-medium text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-[54px] rounded-lg px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-10",
        "icon-lg": "size-12 rounded-full",
      },
    },
    compoundVariants: [
      { variant: ["chip", "quick-reply"], class: "h-9 px-3.5" },
      { variant: "link", class: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

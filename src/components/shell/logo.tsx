import { cn } from "@/lib/utils";

/** The MANYA "M" mark in a rounded tile (sidebar, report header, landing). */
export function LogoMark({
  className,
  tone = "light",
}: {
  className?: string;
  /** light: white tile with purple mark (on purple); dark: purple tile with white mark (on white). */
  tone?: "light" | "dark";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[30px] shrink-0 place-items-center rounded-sm",
        tone === "light" ? "bg-white text-sidebar" : "bg-sidebar text-white",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 18V6l7 8 7-8v12" />
      </svg>
    </span>
  );
}

/** Mark plus "MANYA" wordmark. */
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark tone={tone} />
      <span
        className={cn(
          "font-display text-[19px] font-semibold tracking-[0.04em]",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        MANYA
      </span>
    </span>
  );
}

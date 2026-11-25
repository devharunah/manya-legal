import { cn } from "@/lib/utils";

/** A `<dl>` of facts (design: Fact table). Keys ink-3, values 500. */
export function FactTable({
  rows,
  className,
}: {
  rows: { label: string; value: React.ReactNode; muted?: boolean }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 rounded-md border border-line bg-paper px-4 py-3 text-sm",
        className,
      )}
    >
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-ink-3">{r.label}</dt>
          <dd
            className={cn("min-w-0 font-medium break-words", r.muted && "font-normal text-ink-3")}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Dated events, oldest first (design: Timeline). */
export function Timeline({
  items,
  className,
}: {
  items: { key: string; date: string; text: string; highlight?: boolean }[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, i) => (
        <li key={item.key} className="relative flex gap-3 pb-4 last:pb-0">
          <span aria-hidden className="relative flex w-3 shrink-0 justify-center">
            <span
              className={cn(
                "mt-1.5 size-2.5 rounded-full",
                item.highlight ? "bg-brand-700" : "bg-line-strong",
              )}
            />
            {i < items.length - 1 && <span className="absolute top-4 bottom-[-4px] w-px bg-line" />}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                "font-mono text-xs",
                item.highlight ? "font-semibold text-brand-700" : "text-ink-3",
              )}
            >
              {item.date}
            </span>
            <span className="text-sm text-ink">{item.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Nothing here yet: an icon, a title, a line and one action (design: Empty state). */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong bg-paper px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-700">
        {icon}
      </span>
      <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>
      {body && <p className="max-w-sm text-sm text-ink-2">{body}</p>}
      {action}
    </div>
  );
}

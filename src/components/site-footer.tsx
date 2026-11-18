import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-2xl">
          <strong className="font-semibold text-ink">Legal information, not legal advice.</strong>{" "}
          Manya Legal explains official Ugandan sources in plain language. It does not replace a
          lawyer. Always confirm with the responsible authority before acting.
        </p>
        <p className="flex shrink-0 gap-4">
          <Link href="/sources" className="hover:text-brand-700">
            Sources
          </Link>
          <span>#Hack4Justice2026</span>
        </p>
      </div>
    </footer>
  );
}

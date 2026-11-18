import { Scale } from "lucide-react";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid size-9 place-items-center rounded-xl ${light ? "bg-white/10 text-gold-300" : "bg-brand-800 text-gold-300"} shadow-sm`}
      >
        <Scale className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-lg font-semibold ${light ? "text-white" : "text-brand-900"}`}
        >
          Manya Legal
        </span>
        <span
          className={`block text-[11px] font-medium uppercase tracking-[0.16em] ${light ? "text-gold-200/80" : "text-muted"}`}
        >
          SME Legal Companion
        </span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Manya Legal home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/sources"
            className="hidden rounded-lg px-3 py-2 text-muted transition hover:bg-brand-50 hover:text-brand-800 sm:block"
          >
            Our sources
          </Link>
          <Link
            href="/onboard"
            className="hidden rounded-lg px-3 py-2 text-muted transition hover:bg-brand-50 hover:text-brand-800 sm:block"
          >
            My business
          </Link>
          <Link
            href="/ask"
            className="rounded-lg bg-brand-800 px-4 py-2 text-white shadow-sm transition hover:bg-brand-700"
          >
            Ask a question
          </Link>
        </nav>
      </div>
    </header>
  );
}

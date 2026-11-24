"use client";

import { Scale } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { MessageKey } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

export function Logo({ light = false }: { light?: boolean }) {
  const t = useT();
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid size-9 place-items-center rounded-xl ${light ? "bg-white/10 text-gold-300" : "bg-brand-800 text-gold-300"} shadow-sm`}
      >
        <Scale className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-lg font-semibold tracking-wide ${light ? "text-white" : "text-brand-900"}`}
        >
          MANYA
        </span>
        <span
          className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${light ? "text-gold-200/80" : "text-muted"}`}
        >
          {t("nav.tagline")}
        </span>
      </span>
    </span>
  );
}

const NAV = [
  { href: "/dashboard", label: "nav.dashboard" },
  { href: "/cases", label: "nav.cases" },
  { href: "/vault", label: "nav.vault" },
  { href: "/legal-support", label: "nav.support" },
  { href: "/profile", label: "nav.profile" },
] as const satisfies readonly { href: string; label: MessageKey }[];

/** EN | LG switch. Language names always show in their own language. */
export function LanguageSwitch() {
  const t = useT();
  const [lang, setLang] = useLanguage();
  return (
    <fieldset className="flex rounded-xl border border-line bg-white p-0.5 text-xs font-semibold">
      <legend className="sr-only">{t("nav.language")}</legend>
      {(
        [
          ["lug", "Oluganda"],
          ["en", "English"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
          className={`rounded-lg px-2.5 py-1.5 transition ${lang === value ? "bg-brand-800 text-white" : "text-muted hover:text-brand-800"}`}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}

export function SiteHeader() {
  const t = useT();
  const path = usePathname();
  const inApp = path !== "/" && path !== "/register";

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href={inApp ? "/dashboard" : "/"} aria-label={t("nav.home")}>
          <Logo />
        </Link>
        {inApp && (
          <nav
            aria-label={t("nav.menu")}
            className="hidden items-center gap-1 text-sm font-medium md:flex"
          >
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={path.startsWith(href) ? "page" : undefined}
                className="rounded-lg px-3 py-2 text-muted transition hover:bg-brand-50 hover:text-brand-800 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800"
              >
                {t(label)}
              </Link>
            ))}
          </nav>
        )}
        <LanguageSwitch />
      </div>
      {inApp && (
        <nav
          aria-label={t("nav.menu")}
          className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-1.5 text-xs font-semibold md:hidden"
        >
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={path.startsWith(href) ? "page" : undefined}
              className="shrink-0 rounded-lg px-3 py-1.5 text-muted aria-[current=page]:bg-brand-800 aria-[current=page]:text-white"
            >
              {t(label)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

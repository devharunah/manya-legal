"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/components/app/session";
import { Logo } from "@/components/shell/logo";
import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

/** English | Oluganda segmented control. Language names always show in their own language. */
export function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const t = useT();
  const [lang, setLang] = useLanguage();
  const dark = tone === "dark";
  return (
    <fieldset
      className={`flex rounded-md p-1 text-[13px] ${dark ? "bg-sidebar-track" : "border border-line bg-paper"}`}
    >
      <legend className="sr-only">{t("nav.language")}</legend>
      {(
        [
          ["en", "English"],
          ["lug", "Oluganda"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
          className={
            dark
              ? "h-9 rounded-[7px] px-3 font-medium text-white transition-colors aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-sidebar"
              : "h-9 rounded-[7px] px-3 font-medium text-ink-2 transition-colors hover:text-ink aria-pressed:bg-sidebar aria-pressed:font-semibold aria-pressed:text-white"
          }
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}

/** Shown only to visitors without a profile, and not on the sign-in page itself. */
function SignInLink() {
  const t = useT();
  const pathname = usePathname();
  const { state } = useSession();
  if (state.status !== "ready" || state.profile !== null || pathname === "/login") return null;
  return (
    <Link
      href="/login"
      className="rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
    >
      {t("auth.signInLink")}
    </Link>
  );
}

/** Header for the public pages (landing, registration). */
export function SiteHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--landing-max)] items-center justify-between gap-3 px-5 sm:px-6">
        <Link href="/" aria-label={t("nav.home")} className="flex items-center gap-3 rounded-md">
          <Logo tone="dark" />
          <span className="hidden text-[13px] text-ink-3 sm:inline">{t("nav.tagline")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <SignInLink />
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}

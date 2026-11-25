"use client";

import { Folder, House, Loader2, Lock, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useStartCase } from "@/components/app/case-list";
import { api } from "@/components/app/client-api";
import { useSession } from "@/components/app/session";
import type { CaseRecord } from "@/lib/cases/types";
import type { MessageKey } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

import { Logo, LogoMark } from "./logo";

const NAV = [
  { href: "/dashboard", label: "nav.dashboard", icon: House },
  { href: "/cases", label: "nav.cases", icon: Folder },
  { href: "/vault", label: "nav.vault", icon: Lock },
  { href: "/legal-support", label: "nav.support", icon: Scale },
] as const satisfies readonly { href: string; label: MessageKey; icon: unknown }[];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Initials for the avatar: first letters of the first two names. */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Open cases, refreshed when the trader moves between pages. */
function useOpenCaseCount(path: string): number | null {
  const [count, setCount] = useState<number | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh the count on navigation.
  useEffect(() => {
    let live = true;
    api<{ cases: CaseRecord[] }>("/api/cases")
      .then((r) => live && setCount(r.cases.filter((c) => c.status !== "completed").length))
      .catch(() => live && setCount(null));
    return () => {
      live = false;
    };
  }, [path]);
  return count;
}

/** Oluganda | English on the purple sidebar. Language names show in their own language. */
function SidebarLanguage() {
  const t = useT();
  const [lang, setLang] = useLanguage();
  return (
    <fieldset className="flex rounded-md bg-sidebar-track p-1">
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
          className="h-9 flex-1 rounded-[7px] text-[13px] font-medium text-white transition-colors hover:bg-sidebar-hover aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-sidebar"
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}

function ProfileLink({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { state } = useSession();
  const profile = state.status === "ready" ? state.profile : null;
  const name = profile?.fullName ?? "";
  const onProfile = usePathname() === "/profile";
  const avatar = (
    <span
      aria-hidden
      className="grid size-[34px] shrink-0 place-items-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700"
    >
      {initials(name) || "·"}
    </span>
  );
  if (compact) {
    return (
      <Link
        href="/profile"
        aria-label={t("nav.profile")}
        className="grid size-11 place-items-center rounded-md"
      >
        {avatar}
      </Link>
    );
  }
  return (
    <Link
      href="/profile"
      aria-current={onProfile ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-white transition-colors hover:bg-sidebar-hover"
    >
      {avatar}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="text-xs text-white/70">{t("nav.profile")}</span>
      </span>
    </Link>
  );
}

function Sidebar({ path }: { path: string }) {
  const t = useT();
  const count = useOpenCaseCount(path);
  const { start, busy, error } = useStartCase();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-width)] shrink-0 flex-col gap-7 overflow-y-auto bg-sidebar px-3.5 py-5 text-white md:flex">
      <Link href="/dashboard" aria-label={t("nav.home")} className="rounded-md px-2">
        <Logo />
      </Link>
      <div>
        <button
          type="button"
          onClick={() => void start()}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sidebar-primary font-semibold text-sidebar-primary-foreground transition-colors hover:bg-white/90 disabled:opacity-70"
        >
          {busy ? (
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
          ) : (
            <Plus className="size-[18px]" aria-hidden />
          )}
          {t("shell.newCase")}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-xs text-white">
            {error}
          </p>
        )}
      </div>
      <nav aria-label={t("nav.menu")} className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(path, href) ? "page" : undefined}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-white aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-white"
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                {t(label)}
                {href === "/cases" && count !== null && count > 0 && (
                  <span className="ml-auto rounded-full bg-sidebar-pill px-2 py-px text-xs text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3.5 pt-6">
          <SidebarLanguage />
          <ProfileLink />
        </div>
      </nav>
    </aside>
  );
}

/** Phone: logo and avatar on top, four tabs at the bottom. */
function PhoneBars({ path }: { path: string }) {
  const t = useT();
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-5 pt-[max(12px,env(safe-area-inset-top))] pb-2 md:hidden">
        <Link href="/dashboard" aria-label={t("nav.home")} className="flex items-center gap-2.5">
          <LogoMark tone="dark" />
          <span className="font-display text-[17px] font-semibold tracking-[0.04em]">MANYA</span>
        </Link>
        <ProfileLink compact />
      </header>
      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(path, href) ? "page" : undefined}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-3 aria-[current=page]:font-semibold aria-[current=page]:text-brand-700"
          >
            <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
            {t(label === "nav.vault" ? "shell.vaultShort" : label)}
          </Link>
        ))}
      </nav>
    </>
  );
}

/**
 * The signed-in workspace (design: app shell): a purple sidebar on tablets and
 * desktops, a top bar and bottom tabs on phones. Pages render inside <main>.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const t = useT();
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar path={path} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PhoneBars path={path} />
        <main className="flex flex-1 flex-col px-5 pt-5 pb-24 md:px-6 md:pt-7 md:pb-8 lg:px-[clamp(20px,4vw,56px)]">
          <div className="flex-1">{children}</div>
          <footer className="mx-auto mt-10 flex w-full max-w-[var(--content-max)] flex-wrap justify-between gap-4 text-xs text-ink-3">
            <span>{t("shell.notAdvice")}</span>
            <Link href="/legal-support" className="text-ink-2 hover:text-brand-700">
              {t("footer.sources")}
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

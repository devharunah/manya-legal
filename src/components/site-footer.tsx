"use client";

import Link from "next/link";

import { LogoMark } from "@/components/shell/logo";
import { useT } from "@/lib/i18n/use-t";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[var(--landing-max)] flex-col gap-4 px-5 py-8 text-xs leading-relaxed text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex max-w-2xl items-start gap-3">
          <LogoMark tone="dark" className="mt-0.5" />
          <p>
            <strong className="font-semibold text-ink">{t("footer.notAdvice")}</strong>{" "}
            {t("footer.body")}
          </p>
        </div>
        <p className="flex shrink-0 gap-4">
          <Link href="/legal-support" className="text-ink-2 hover:text-brand-700">
            {t("footer.sources")}
          </Link>
          <span>#Hack4Justice2026</span>
        </p>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/use-t";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-2xl">
          <strong className="font-semibold text-ink">{t("footer.notAdvice")}</strong>{" "}
          {t("footer.body")}
        </p>
        <p className="flex shrink-0 gap-4">
          <Link href="/legal-support" className="hover:text-brand-700">
            {t("footer.sources")}
          </Link>
          <span>#Hack4Justice2026</span>
        </p>
      </div>
    </footer>
  );
}

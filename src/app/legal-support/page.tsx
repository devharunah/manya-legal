"use client";

import { useT } from "@/lib/i18n/use-t";

export default function LegalSupportPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("support.title")}</h1>
      <p className="mt-4 text-muted">{t("support.body")}</p>
      <p className="mt-2 text-sm text-muted">{t("support.noPractitioners")}</p>
    </main>
  );
}

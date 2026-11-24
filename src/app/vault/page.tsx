"use client";

import { RequireProfile } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

export default function VaultPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("vault.title")}</h1>
      <RequireProfile>
        {() => (
          <div className="mt-4 space-y-2 text-muted">
            <p>{t("vault.body")}</p>
            <p className="text-sm">{t("vault.notShared")}</p>
          </div>
        )}
      </RequireProfile>
    </main>
  );
}

"use client";

import { Loader2 } from "lucide-react";

import { CaseList, useCases } from "@/components/app/case-list";
import { RequireProfile } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

function All() {
  const t = useT();
  const { cases, error } = useCases();
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!cases)
    return <Loader2 className="size-5 animate-spin text-muted" aria-label={t("common.loading")} />;
  return <CaseList cases={cases} empty={t("dashboard.none")} />;
}

export default function CasesPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-900">
        {t("cases.title")}
      </h1>
      <RequireProfile>{() => <All />}</RequireProfile>
    </main>
  );
}

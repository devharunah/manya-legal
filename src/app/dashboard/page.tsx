"use client";

import { Archive, ChevronRight, Loader2, Store } from "lucide-react";
import Link from "next/link";

import { CaseList, NewCaseButton, useCases } from "@/components/app/case-list";
import { RequireProfile } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

function Cases() {
  const t = useT();
  const { cases, error } = useCases();
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!cases)
    return <Loader2 className="size-5 animate-spin text-muted" aria-label={t("common.loading")} />;
  const active = cases.filter((c) => c.status !== "completed");
  const done = cases.filter((c) => c.status === "completed");
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold text-ink">{t("dashboard.active")}</h2>
        <CaseList cases={active} empty={t("dashboard.none")} />
      </section>
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-ink">{t("dashboard.completed")}</h2>
          <CaseList cases={done} empty={t("dashboard.none")} />
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <RequireProfile>
        {(profile) => (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <h1 className="font-display text-3xl font-semibold text-brand-900">
                {t("dashboard.welcome", { n: profile.fullName.split(" ")[0] ?? profile.fullName })}
              </h1>
              <section className="bg-grain rounded-3xl p-6 text-white shadow-lg">
                <h2 className="font-display text-2xl font-semibold">{t("dashboard.newTitle")}</h2>
                <p className="mt-2 max-w-lg text-brand-100/90">{t("dashboard.newBody")}</p>
                <NewCaseButton className="mt-5" />
              </section>
              <Cases />
            </div>
            <aside className="space-y-4">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <Store className="size-4" aria-hidden /> {t("dashboard.profile")}
                </h2>
                <p className="mt-2 font-semibold text-ink">
                  {profile.businessName || profile.fullName}
                </p>
                <p className="text-sm text-muted">
                  {t(`businessType.${profile.businessType}` as Parameters<typeof t>[0])}
                  {profile.location ? ` · ${profile.location}` : ""}
                </p>
                <Link
                  href="/profile"
                  className="mt-3 inline-block text-sm font-semibold text-brand-700"
                >
                  {t("nav.profile")}
                </Link>
              </section>
              <Link
                href="/vault"
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand-300"
              >
                <Archive className="size-5 text-brand-700" aria-hidden />
                <span className="flex-1">
                  <span className="block font-semibold text-ink">{t("nav.vault")}</span>
                  <span className="block text-sm text-muted">{t("dashboard.vaultBody")}</span>
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden />
              </Link>
            </aside>
          </div>
        )}
      </RequireProfile>
    </main>
  );
}

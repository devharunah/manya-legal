"use client";

import { Archive, ChevronRight, Loader2, Store } from "lucide-react";
import Link from "next/link";

import { CaseList, NewCaseButton, useCases } from "@/components/app/case-list";
import { DemoButton, LiveDemoButton } from "@/components/app/demo-button";
import { RequireProfile } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

function Cases() {
  const t = useT();
  const { cases, error } = useCases();
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!cases)
    return <Loader2 className="size-5 animate-spin text-ink-3" aria-label={t("common.loading")} />;
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
    <div className="mx-auto w-full max-w-[1040px]">
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
                <div className="mt-5 flex flex-wrap items-start gap-3">
                  <NewCaseButton />
                  <DemoButton
                    label="demo.load"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                  />
                  <LiveDemoButton className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60" />
                </div>
              </section>
              <Cases />
            </div>
            <aside className="space-y-4">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-3">
                  <Store className="size-4" aria-hidden /> {t("dashboard.profile")}
                </h2>
                <p className="mt-2 font-semibold text-ink">
                  {profile.businessName || profile.fullName}
                </p>
                <p className="text-sm text-ink-3">
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
                  <span className="block text-sm text-ink-3">{t("dashboard.vaultBody")}</span>
                </span>
                <ChevronRight className="size-4 text-ink-3" aria-hidden />
              </Link>
            </aside>
          </div>
        )}
      </RequireProfile>
    </div>
  );
}

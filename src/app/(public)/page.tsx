"use client";

import { ArrowRight, FolderOpen, Handshake, MapPin, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { DemoButton, LiveDemoButton } from "@/components/app/demo-button";
import { useSession } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

const STEPS = [
  { icon: MessageSquareText, title: "landing.report", body: "landing.reportBody" },
  { icon: FolderOpen, title: "landing.organise", body: "landing.organiseBody" },
  { icon: Handshake, title: "landing.resolve", body: "landing.resolveBody" },
] as const;

export default function Home() {
  const t = useT();
  const { state } = useSession();
  const registered = state.status === "ready" && state.profile !== null;

  return (
    <main>
      <section className="bg-grain text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="animate-rise max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-200">
              <MapPin className="size-3.5" aria-hidden /> {t("landing.badge")}
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
              {t("landing.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-100/90">
              {t("landing.body")}
            </p>
            <Link
              href={registered ? "/dashboard" : "/register"}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 font-semibold text-brand-950 shadow-lg shadow-gold-500/20 transition hover:bg-gold-300"
            >
              {t("landing.start")} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <DemoButton
                label="demo.open"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              />
              <LiveDemoButton className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60" />
            </div>
            <p className="mt-2 text-xs text-brand-100/70">{t("demo.note")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-xs font-bold tracking-[0.2em] text-gold-600">0{i + 1}</span>
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-brand-900">{t(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-3">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

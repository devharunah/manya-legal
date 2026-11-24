"use client";

import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Gavel,
  ListChecks,
  MessageSquareText,
  SearchX,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { toAnswerText } from "@/lib/answer/text";
import type { Answer, AnswerText, CitedSource, LugandaAnswer } from "@/lib/answer/types";
import { type Translator, lookup, useT } from "@/lib/i18n/use-t";

import { CurrencyBadge } from "./currency-badge";
import { SourceDrawer } from "./source-drawer";
import { SpeakButton } from "./voice/speak-button";

/** Where the Luganda version of an answer has got to. */
export type Translation =
  | { status: "loading" }
  | ({ status: "ready" } & LugandaAnswer)
  | { status: "failed"; error: string };

const STATUS = {
  answered: {
    label: "answer.answered",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Icon: CheckCircle2,
  },
  partial: {
    label: "answer.partial",
    className: "bg-gold-50 text-gold-700 ring-gold-200",
    Icon: AlertTriangle,
  },
  not_covered: {
    label: "answer.notCovered",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    Icon: SearchX,
  },
} as const;

/** A referral's reason in the interface language; unknown referrals keep their own text. */
function lookupReferral(t: Translator, name: string, why: string): string {
  const label = lookup(t, "referral", name);
  return label === name ? why : label;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
        <Icon className="size-4 text-gold-500" aria-hidden />
        {title}
      </h3>
      <div className="mt-2.5 text-[15px] leading-7 text-ink">{children}</div>
    </section>
  );
}

function CitePill({ n, onClick, label }: { n: number; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-md bg-brand-100 px-1 align-text-top text-[11px] font-bold text-brand-800 transition hover:bg-brand-200"
      aria-label={label}
    >
      {n}
    </button>
  );
}

function LanguageToggle({
  lang,
  onChange,
  legend,
}: {
  lang: "lug" | "en";
  onChange: (lang: "lug" | "en") => void;
  legend: string;
}) {
  return (
    <fieldset className="inline-flex rounded-xl bg-brand-50 p-1 text-xs font-semibold">
      <legend className="sr-only">{legend}</legend>
      {(["lug", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`rounded-lg px-3 py-1.5 transition ${lang === l ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70"}`}
        >
          {l === "lug" ? "Oluganda" : "English"}
        </button>
      ))}
    </fieldset>
  );
}

function TranslationNotice({ translation, t }: { translation: Translation; t: Translator }) {
  if (translation.status === "loading") {
    return (
      <output className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <span className="flex gap-1" aria-hidden>
          <span className="dot size-1.5 rounded-full bg-brand-500" />
          <span className="dot size-1.5 rounded-full bg-brand-500" />
          <span className="dot size-1.5 rounded-full bg-brand-500" />
        </span>
        {t("answer.translating")}
      </output>
    );
  }
  if (translation.status === "failed") {
    return (
      <output className="block rounded-2xl bg-gold-50 px-4 py-3 text-sm text-gold-700">
        {translation.error} {t("answer.showingEnglish")}
      </output>
    );
  }
  return (
    <p
      className="rounded-2xl bg-gold-50 px-4 py-3 text-sm leading-6 text-gold-700"
      data-testid="mt-notice"
    >
      <strong>{t("answer.mtTitle")}</strong> {t("answer.mtBody")}
      {translation.keptInEnglish > 0 &&
        ` ${t("answer.keptEnglish", { n: translation.keptInEnglish })}`}
    </p>
  );
}

export function AnswerCard({
  answer,
  translation,
  voice = false,
}: {
  answer: Answer;
  translation?: Translation;
  voice?: boolean;
}) {
  const [view, setView] = useState<"plain" | "law">("plain");
  const [open, setOpen] = useState<number | null>(null);
  const [lang, setLang] = useState<"lug" | "en">("lug");
  const t = useT();
  const status = STATUS[answer.status];
  const indexOf = new Map(answer.sources.map((s, i) => [s.chunkId, i + 1]));
  const openSource: CitedSource | undefined = open === null ? undefined : answer.sources[open - 1];
  const inLuganda = translation?.status === "ready" && lang === "lug";
  const text: AnswerText = inLuganda ? translation.text : toAnswerText(answer);
  const canSpeak = voice && inLuganda;

  return (
    <article
      className="animate-rise overflow-hidden rounded-3xl border border-line bg-white shadow-sm"
      data-testid="answer-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/60 px-5 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
        >
          <status.Icon className="size-3.5" aria-hidden /> {t(status.label)}
        </span>
        {translation?.status === "ready" && (
          <LanguageToggle lang={lang} onChange={setLang} legend={t("nav.language")} />
        )}
        {answer.sources.length > 0 && (
          <div
            className="inline-flex rounded-xl bg-brand-50 p-1 text-xs font-semibold"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "plain"}
              onClick={() => setView("plain")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${view === "plain" ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70"}`}
            >
              <Sparkles className="size-3.5" aria-hidden /> {t("answer.tabPlain")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "law"}
              onClick={() => setView("law")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${view === "law" ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70"}`}
            >
              <BookOpen className="size-3.5" aria-hidden /> {t("answer.tabLaw")}
            </button>
          </div>
        )}
      </header>

      {view === "plain" ? (
        <div className="space-y-7 p-5 sm:p-7" lang={inLuganda ? "lg" : "en"}>
          {translation && (translation.status !== "ready" || lang === "lug") && (
            <TranslationNotice translation={translation} t={t} />
          )}

          <p className="font-display text-xl leading-8 font-medium text-brand-950 sm:text-[22px]">
            {text.directAnswer}
          </p>

          {canSpeak && <SpeakButton pieces={translation.speech.all} label={t("speak.listen")} />}

          {answer.lawSays.length > 0 && (
            <Section icon={Gavel} title={t("answer.lawSays")}>
              <ul className="space-y-2.5">
                {answer.lawSays.map((item, i) => (
                  <li key={`${i}-${item.point}`} className="flex gap-3">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold-400"
                      aria-hidden
                    />
                    <span>
                      {text.lawSays[i] ?? item.point}{" "}
                      {item.supported ? (
                        item.chunkIds.map((id) => {
                          const n = indexOf.get(id);
                          return n ? (
                            <CitePill
                              key={id}
                              n={n}
                              label={t("answer.openSource", { n })}
                              onClick={() => setOpen(n)}
                            />
                          ) : null;
                        })
                      ) : (
                        <span className="ml-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                          {t("answer.noSource")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {text.meansForYou && (
            <Section icon={Briefcase} title={t("answer.meansForYou")}>
              <p>{text.meansForYou}</p>
            </Section>
          )}

          {text.nextSteps.length > 0 && (
            <Section icon={ListChecks} title={t("answer.nextSteps")}>
              {canSpeak && (
                <div className="mb-3">
                  <SpeakButton pieces={translation.speech.steps} label={t("speak.listenSteps")} />
                </div>
              )}
              <ol className="space-y-2">
                {text.nextSteps.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {text.clarifyingQuestions.length > 0 && (
            <Section icon={CircleHelp} title={t("answer.couldChange")}>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {text.clarifyingQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </Section>
          )}

          {(text.uncertainty || text.warnings.length > 0) && (
            <div className="space-y-2 rounded-2xl bg-gold-50 p-4 text-sm leading-6 text-gold-700">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" aria-hidden /> {t("answer.doubleCheck")}
              </p>
              {text.uncertainty && <p>{text.uncertainty}</p>}
              {text.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}

          {answer.needsLawyer && (
            <div className="flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
              <MessageSquareText className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <p>
                <strong>{t("answer.lawyerTitle")}</strong> {t("answer.lawyerBody")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-5 sm:p-7">
          <p className="text-sm text-muted">
            {t("answer.lawIntro")}
            {translation && ` ${t("answer.lawNotTranslated")}`}
          </p>
          {answer.sources.map((s, i) => (
            <figure key={s.chunkId} className="rounded-2xl border border-line p-4">
              <figcaption className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-800">
                <span className="grid size-5 place-items-center rounded-md bg-brand-100 text-[11px]">
                  {i + 1}
                </span>
                {s.sourceShortTitle}, {s.locator}
                <CurrencyBadge currency={s.currency} />
              </figcaption>
              <blockquote className="mt-3 font-display text-[15px] leading-7 text-ink/85">
                {s.text}
              </blockquote>
            </figure>
          ))}
        </div>
      )}

      {(answer.sources.length > 0 || answer.referrals.length > 0) && (
        <footer className="grid gap-5 border-t border-line bg-paper/60 p-5 sm:p-7 md:grid-cols-2">
          {answer.sources.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{t("answer.sources")}</h3>
              <ol className="mt-2 space-y-1.5">
                {answer.sources.map((s, i) => (
                  <li key={s.chunkId}>
                    <button
                      type="button"
                      onClick={() => setOpen(i + 1)}
                      className="group flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-sm transition hover:bg-white"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-brand-100 text-[11px] font-bold text-brand-800">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-medium text-ink group-hover:text-brand-800">
                          {s.sourceShortTitle}
                        </span>
                        <span className="text-muted"> · {s.locator}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {answer.referrals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {t("answer.help")}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {answer.referrals.map((r) => (
                  <li key={r.name}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-lg p-1.5 text-sm transition hover:bg-white"
                    >
                      <span className="flex items-center gap-1 font-medium text-ink group-hover:text-brand-800">
                        {r.name} <ExternalLink className="size-3" aria-hidden />
                      </span>
                      <span className="block text-muted">{lookupReferral(t, r.name, r.why)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </footer>
      )}

      {openSource && open !== null && (
        <SourceDrawer source={openSource} index={open} onClose={() => setOpen(null)} />
      )}
    </article>
  );
}

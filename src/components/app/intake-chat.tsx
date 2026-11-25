"use client";

import { ClipboardCheck, Info, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { CaseRecord, Message } from "@/lib/cases/types";
import { suggestedAnswer } from "@/lib/demo/script";
import { type MessageKey, en } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import { decodeFields, stepNumber } from "@/lib/intake/progress";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";
import { Composer } from "./composer";
import type { WorkspaceUpdate } from "./workspace-types";

function Bubble({ m }: { m: Message }) {
  const t = useT();
  const mine = m.sender === "trader";
  // MANYA's lines are stored as keys (plus the fields they ask about), so they
  // show in whichever language is chosen now, listing only what is missing.
  const labels = decodeFields(m.field)
    .map((k) => t(`field.${k}`).toLowerCase())
    .join(", ");
  const text =
    m.sender === "manya" || m.inputType === "system"
      ? m.originalText in en
        ? t(m.originalText as MessageKey, { n: labels })
        : m.originalText
      : m.originalText;
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        data-testid={mine ? "trader-message" : "manya-message"}
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-6 shadow-sm ${
          mine
            ? "rounded-br-sm bg-brand-800 text-white"
            : "rounded-bl-sm border border-line bg-white text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        {mine && m.processedText && (
          <p className="mt-1.5 border-t border-white/20 pt-1.5 text-xs text-brand-100/80">
            {t("intake.heardEnglish", { n: m.processedText })}
          </p>
        )}
      </div>
    </li>
  );
}

/** PRD 4.3: guided intake, one question at a time, with voice or text. */
export function IntakeChat({
  record,
  messages,
  update,
}: {
  record: CaseRecord;
  messages: Message[];
  update: WorkspaceUpdate;
}) {
  const t = useT();
  const [lang] = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ text: string; nonce: number }>();
  const endRef = useRef<HTMLLIElement>(null);

  const lastManya = [...messages].reverse().find((m) => m.sender === "manya");
  const asking = lastManya?.field ? decodeFields(lastManya.field) : [];
  // Live stage demo: a prepared answer for the question on screen.
  const suggestion =
    record.intake.demo === "live"
      ? suggestedAnswer(lastManya?.originalText ?? null, messages.length > 0)
      : null;
  const open =
    record.status === "draft" ||
    record.status === "collecting_information" ||
    record.status === "paused";

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever a message is added.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function post(body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      if (record.language !== lang) {
        await api(`/api/cases/${record.id}/intake`, {
          method: "PATCH",
          body: { action: "language", language: lang },
        });
      }
      const r = await api<{ case: CaseRecord; added: Message[] }>(
        `/api/cases/${record.id}/messages`,
        { body },
      );
      update((w) => ({ ...w, case: r.case, messages: [...w.messages, ...r.added] }));
      return true;
    } catch (e) {
      setError(lang === "en" ? (e as Error).message : t("intake.error"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function review() {
    setBusy(true);
    try {
      const r = await api<{ case: CaseRecord }>(`/api/cases/${record.id}/intake`, {
        method: "PATCH",
        body: { action: "review" },
      });
      update((w) => ({ ...w, case: r.case }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label={t("case.tabReport")}
      className="rounded-3xl border border-line bg-paper p-3 sm:p-5"
    >
      {open && (
        <div className="mb-3 flex items-center gap-3 px-1" data-testid="intake-step">
          <span className="text-xs font-semibold text-brand-800">
            {t("intake.step", { n: stepNumber(record.intake) })}
          </span>
          <span className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-full ${n <= stepNumber(record.intake) ? "bg-brand-600" : "bg-line"}`}
              />
            ))}
          </span>
        </div>
      )}
      <ol className="max-h-[55vh] space-y-3 overflow-y-auto p-1" aria-live="polite">
        <li className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-2.5 text-[15px] leading-6 shadow-sm">
            {t("intake.greeting")}
          </div>
        </li>
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {busy && (
          <li className="flex items-center gap-2 text-sm text-ink-3">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {t("intake.thinking")}
          </li>
        )}
        <li ref={endRef} aria-hidden />
      </ol>

      {open && (
        <div className="mt-3">
          {suggestion && (
            <button
              type="button"
              disabled={busy}
              data-testid="demo-suggestion"
              onClick={() => setDraft({ text: suggestion, nonce: Date.now() })}
              className="mb-2 flex w-full items-start gap-2 rounded-xl border border-dashed border-gold-400 bg-gold-50 px-3 py-2 text-left text-sm text-ink transition hover:bg-gold-100 disabled:opacity-60"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
              <span>
                <span className="block text-xs font-semibold text-gold-700">
                  {t("demo.suggested")}
                </span>
                <span className="line-clamp-2">{suggestion}</span>
              </span>
            </button>
          )}
          <Composer
            {...(draft ? { draft } : {})}
            busy={busy}
            placeholder={messages.length === 0 ? t("intake.placeholder") : t("intake.answerHere")}
            onSend={(text, inputType) => post({ text, inputType })}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {asking.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void post({ skip: true })}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-3 hover:text-brand-800"
              >
                {t("intake.skip")}
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void review()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800"
              >
                <ClipboardCheck className="size-4" aria-hidden /> {t("intake.reviewNow")}
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <p className="mt-3 flex gap-1.5 text-xs leading-5 text-ink-3">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("intake.micHint")} {t("intake.aiNotice")}{" "}
            {lang === "lug" ? t("intake.voiceNotice") : ""}
          </p>
        </div>
      )}
    </section>
  );
}

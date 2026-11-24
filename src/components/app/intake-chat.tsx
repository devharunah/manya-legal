"use client";

import { ClipboardCheck, Info, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { CaseRecord, Message } from "@/lib/cases/types";
import { lookup, useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";
import { Composer } from "./composer";
import type { WorkspaceUpdate } from "./workspace-types";

function Bubble({ m }: { m: Message }) {
  const t = useT();
  const mine = m.sender === "trader";
  // MANYA's lines are stored as keys, so they show in whichever language is chosen now.
  const text =
    m.sender === "manya" || m.inputType === "system"
      ? lookup(t, m.originalText, m.originalText)
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
  const endRef = useRef<HTMLLIElement>(null);

  const lastManya = [...messages].reverse().find((m) => m.sender === "manya");
  const asking = lastManya?.field ?? null;
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
          <li className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {t("intake.thinking")}
          </li>
        )}
        <li ref={endRef} aria-hidden />
      </ol>

      {open && (
        <div className="mt-3">
          <Composer
            busy={busy}
            placeholder={messages.length === 0 ? t("intake.placeholder") : t("intake.answerHere")}
            onSend={(text, inputType) => post({ text, inputType })}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {asking && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void post({ skip: asking })}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-muted hover:text-brand-800"
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
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="mt-3 flex gap-1.5 text-xs leading-5 text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("intake.micHint")} {t("intake.aiNotice")}{" "}
            {lang === "lug" ? t("intake.voiceNotice") : ""}
          </p>
        </div>
      )}
    </section>
  );
}

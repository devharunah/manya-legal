"use client";

import { ClipboardCheck, Info, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import type { CaseRecord, Message } from "@/lib/cases/types";
import { suggestedAnswer } from "@/lib/demo/script";
import { type MessageKey, en } from "@/lib/i18n/en";
import { useT } from "@/lib/i18n/use-t";
import { decodeFields, stepNumber } from "@/lib/intake/progress";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";
import { Composer } from "./composer";
import type { WorkspaceUpdate } from "./workspace-types";

/** MANYA's line: the mark tile, then text with no bubble (design: Chat message). */
function ManyaLine({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <li className="flex animate-manya-in gap-3">
      <LogoMark tone="dark" />
      <p
        data-testid={testId}
        className="max-w-[88%] pt-[3px] text-[15px] leading-[1.5] whitespace-pre-wrap text-ink"
      >
        {children}
      </p>
    </li>
  );
}

function Line({ m }: { m: Message }) {
  const t = useT();
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

  if (m.sender === "manya") return <ManyaLine testId="manya-message">{text}</ManyaLine>;

  const voice = m.inputType === "voice";
  return (
    <li data-testid="trader-message" className="flex animate-manya-in flex-col items-end gap-1.5">
      <div className="max-w-[80%] rounded-[16px_16px_4px_16px] bg-brand-700 px-3.5 py-2.5 text-[15px] leading-[1.5] text-white sm:max-w-[78%]">
        {voice && (
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-white/80">
            <Mic className="size-3.5" aria-hidden /> {t("chat.voiceNote")}
          </span>
        )}
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
      {m.processedText && (
        <p className="max-w-[420px] text-right text-[13px] text-ink-2">
          {t("intake.heardEnglish", { n: m.processedText })}
        </p>
      )}
    </li>
  );
}

/** Three dots while MANYA reads the message. */
function Typing() {
  const t = useT();
  return (
    <li className="flex items-center gap-3">
      <LogoMark tone="dark" />
      <output aria-label={t("intake.thinking")} className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-[7px] animate-manya-dot rounded-full bg-ink-3"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </output>
    </li>
  );
}

/** PRD 4.3: guided intake, one question at a time, with voice or text (design: AI chat). */
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
  const listRef = useRef<HTMLOListElement>(null);

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
  const step = stepNumber(record.intake);

  // Follow new messages unless the trader has scrolled up to read.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever a message is added.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 160;
    if (nearEnd || busy) list.scrollTo({ top: list.scrollHeight });
  }, [messages.length, busy]);

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
      aria-label={t("chat.title")}
      className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-paper"
    >
      {open && (
        <div
          className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6"
          data-testid="intake-step"
        >
          <span className="text-xs font-semibold text-brand-700">
            {t("intake.step", { n: step })}
          </span>
          <span className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1 flex-1 rounded-[2px] ${n <= step ? "bg-brand-700" : "bg-line"}`}
              />
            ))}
          </span>
        </div>
      )}
      <ol
        ref={listRef}
        role="log"
        aria-live="polite"
        className="mx-auto flex max-h-[60vh] w-full max-w-[var(--chat-column)] flex-col gap-[22px] overflow-y-auto px-4 py-6 sm:px-6"
      >
        <ManyaLine>{t("intake.greeting")}</ManyaLine>
        {messages.map((m) => (
          <Line key={m.id} m={m} />
        ))}
        {busy && <Typing />}
      </ol>

      {open && (
        <div className="border-t border-line px-4 pt-3 pb-4 sm:px-6">
          <div className="mx-auto w-full max-w-[var(--chat-column)]">
            {suggestion && (
              <div className="mb-2.5 flex flex-col items-start gap-1">
                <span className="text-xs font-medium text-ink-3">{t("demo.suggested")}</span>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="demo-suggestion"
                  onClick={() => setDraft({ text: suggestion, nonce: Date.now() })}
                  className="max-w-full rounded-[18px] border border-brand-700 bg-paper px-3.5 py-2 text-left text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
                >
                  <span className="line-clamp-2">{suggestion}</span>
                </button>
              </div>
            )}
            <Composer
              {...(draft ? { draft } : {})}
              busy={busy}
              placeholder={messages.length === 0 ? t("intake.placeholder") : t("intake.answerHere")}
              onSend={(text, inputType) => post({ text, inputType })}
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {asking.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void post({ skip: true })}
                >
                  {t("intake.skip")}
                </Button>
              )}
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void review()}
                  className="text-brand-700"
                >
                  <ClipboardCheck aria-hidden /> {t("intake.reviewNow")}
                </Button>
              )}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
            <p className="mt-3 flex gap-1.5 text-xs leading-5 text-ink-3">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {t("intake.micHint")} {t("intake.aiNotice")}{" "}
                {lang === "lug" ? t("intake.voiceNotice") : ""}
              </span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

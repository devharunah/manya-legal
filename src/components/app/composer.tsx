"use client";

import { ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { MAX_SECONDS, useLiveRecorder } from "@/components/voice/use-recorder";
import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Five bars that follow the microphone level. */
function LevelBars({ level }: { level: number }) {
  return (
    <span className="flex h-4 items-center gap-0.5" aria-hidden>
      {[0.5, 0.8, 1, 0.8, 0.5].map((w, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative bars
          key={i}
          className="w-[3px] rounded-full bg-brand-700 transition-[height] duration-100"
          style={{ height: `${Math.max(15, Math.min(100, level * w * 140))}%` }}
        />
      ))}
    </span>
  );
}

/**
 * Message box with live voice notes. Tap the mic and talk: the words appear
 * in the box as they are recognised. The square stops (pauses) listening and
 * leaves the text to check and edit; the arrow sends. Tapping the mic again
 * adds to what is already there.
 */
export function Composer({
  busy,
  placeholder,
  onSend,
  draft,
}: {
  busy: boolean;
  placeholder: string;
  onSend: (text: string, inputType: "text" | "voice") => Promise<boolean>;
  /** Text to put in the box (a tapped demo answer); a new nonce fills it again. */
  draft?: { text: string; nonce: number };
}) {
  const t = useT();
  const [lang] = useLanguage();
  const [text, setText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  // A newly tapped demo answer replaces the box text (set during render, not in an effect).
  const [shownDraft, setShownDraft] = useState(draft);
  if (draft !== shownDraft) {
    setShownDraft(draft);
    if (draft) {
      setText(draft.text);
      setUsedVoice(false);
    }
  }
  // Text typed before the current recording; live words are added after it.
  const base = useRef("");
  const area = useRef<HTMLTextAreaElement>(null);
  const recorder = useLiveRecorder({
    language: lang === "lug" ? "lug" : "eng",
    onInterim: (heard) => setText(joinText(base.current, heard)),
  });
  const recording = recorder.state === "recording";
  const finishing = recorder.state === "finishing";

  // Grow with the text, up to about six lines.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resize whenever the text changes
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  useEffect(() => {
    if (!recording && !finishing) area.current?.focus({ preventScroll: true });
  }, [recording, finishing]);

  async function startRecording() {
    base.current = text;
    recorder.clearError();
    await recorder.start();
  }

  /** Stops listening and puts the final transcript in the box. Returns the full text. */
  async function stopRecording(): Promise<string> {
    const heard = await recorder.stop();
    if (!heard) return base.current || text;
    setUsedVoice(true);
    const full = joinText(base.current, heard);
    setText(full);
    return full;
  }

  async function send() {
    const message = (recording ? await stopRecording() : text).trim();
    if (!message || busy) return;
    const sent = await onSend(message, usedVoice ? "voice" : "text");
    if (sent) {
      setText("");
      setUsedVoice(false);
      base.current = "";
    }
  }

  const canSend = !busy && !finishing && (recording || text.trim().length > 0);

  const hasText = text.trim().length > 0;

  return (
    <div>
      <div
        className={`rounded-xl bg-paper p-2 transition-[border-color,box-shadow,background-color] ${
          recording
            ? "border-2 border-brand-700 bg-brand-50"
            : "border border-line-strong focus-within:border-brand-700 focus-within:shadow-[var(--focus-ring-input)]"
        }`}
      >
        {(recording || finishing) && (
          <div
            className="flex items-center gap-2 px-2 pt-1 pb-2 text-[13px] font-medium"
            aria-live="polite"
          >
            {recording ? (
              <>
                <span className="text-brand-700">{t("mic.listening")}</span>
                <span className="font-mono text-brand-700 tabular-nums">
                  {clock(recorder.seconds)}
                </span>
                <LevelBars level={recorder.level} />
                <span className="ml-auto font-mono text-xs text-ink-3 tabular-nums">
                  / {clock(MAX_SECONDS)}
                </span>
              </>
            ) : (
              <>
                <Loader2 className="size-3.5 animate-spin text-brand-700" aria-hidden />
                <span className="text-brand-700">{t("mic.finishing")}</span>
              </>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="intake-input" className="sr-only">
            {t("intake.label")}
          </label>
          <textarea
            ref={area}
            id="intake-input"
            rows={1}
            value={text}
            maxLength={1500}
            readOnly={recording || finishing}
            placeholder={recording ? t("mic.listening") : placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            className="max-h-42 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 text-ink outline-none placeholder:text-placeholder focus-visible:shadow-none"
          />
          <button
            type="button"
            onClick={() => void (recording ? stopRecording() : startRecording())}
            disabled={finishing || (busy && !recording)}
            aria-label={recording ? t("mic.stop") : t("mic.record")}
            data-state={recorder.state}
            className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50 ${
              recording
                ? "animate-manya-pulse bg-ink text-white"
                : "bg-brand-50 text-brand-700 hover:bg-brand-100"
            }`}
          >
            {finishing ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : recording ? (
              <Square className="size-3.5 fill-current" aria-hidden />
            ) : (
              <Mic className="size-5" strokeWidth={1.9} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            aria-label={t("intake.send")}
            className={`grid size-10 shrink-0 place-items-center rounded-full text-white transition-colors ${
              hasText || recording ? "bg-ink hover:bg-ink-hover" : "bg-muted-fg"
            } disabled:cursor-not-allowed`}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="size-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>
      {recorder.error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t(recorder.error)}
        </p>
      )}
    </div>
  );
}

function joinText(before: string, heard: string): string {
  const a = before.trim();
  const b = heard.trim();
  return a && b ? `${a} ${b}` : a || b;
}

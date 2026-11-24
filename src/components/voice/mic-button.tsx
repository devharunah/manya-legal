"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useState } from "react";

import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

import { transcribe } from "./api";
import { MAX_SECONDS, useRecorder } from "./use-recorder";

/**
 * Records a Luganda voice note and puts the transcript in the question box,
 * where the trader can read and fix it before asking. Nothing legal is
 * answered from a transcript the trader hasn't seen.
 */
export function MicButton({
  disabled,
  onTranscript,
  onError,
}: {
  disabled: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string | null) => void;
}) {
  const t = useT();
  const [lang] = useLanguage();
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRecorder(async (wav) => {
    setTranscribing(true);
    try {
      onTranscript(await transcribe(wav));
      onError(null);
    } catch (e) {
      // Server messages are English; in Luganda show our translated one instead.
      onError(lang === "en" && e instanceof Error ? e.message : t("mic.transcribeFailed"));
    } finally {
      setTranscribing(false);
    }
  });

  const recorderError = recorder.error;
  useEffect(() => {
    if (recorderError) onError(t(recorderError));
  }, [recorderError, onError, t]);

  const recording = recorder.state === "recording";
  const busy = recorder.state === "processing" || transcribing;

  return (
    <button
      type="button"
      onClick={() => (recording ? recorder.stop() : void recorder.start())}
      // Stopping is always allowed, even while a typed question is being answered.
      disabled={busy || (disabled && !recording)}
      aria-label={recording ? t("mic.stop") : t("mic.record")}
      data-state={busy ? "transcribing" : recorder.state}
      className={`relative grid size-12 shrink-0 place-items-center rounded-xl transition disabled:opacity-50 ${
        recording
          ? "bg-red-600 text-white hover:bg-red-700"
          : "border border-line bg-white text-brand-800 hover:bg-brand-50"
      }`}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : recording ? (
        <>
          <Square className="size-4" aria-hidden />
          <span className="absolute -top-2 -right-2 rounded-full bg-ink px-1.5 text-[10px] font-bold text-white tabular-nums">
            {MAX_SECONDS - recorder.seconds}s
          </span>
        </>
      ) : (
        <Mic className="size-5" aria-hidden />
      )}
    </button>
  );
}

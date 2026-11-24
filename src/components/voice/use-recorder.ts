"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TARGET_RATE, encodeWav, mixToMono, resample } from "@/lib/audio/wav";
import type { MessageKey } from "@/lib/i18n/en";

export const MAX_SECONDS = 30;

const canRecord = () =>
  typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

export type RecorderState = "idle" | "recording" | "processing";

/** Decodes whatever the browser recorded into 16 kHz mono WAV. */
async function toWav(recorded: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(await recorded.arrayBuffer());
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) =>
      decoded.getChannelData(i),
    );
    const mono = resample(mixToMono(channels), decoded.sampleRate, TARGET_RATE);
    return new Blob([encodeWav(mono, TARGET_RATE)], { type: "audio/wav" });
  } finally {
    void ctx.close();
  }
}

/** Which message to show for a failed recording, as a key for the interface language. */
function micError(error: unknown): MessageKey {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "mic.blocked";
  }
  if (name === "NotFoundError")
    return "mic.notFound";
  if (name === "NotSupportedError" || name === "NotReadableError") {
    return "mic.unsupported";
  }
  return "mic.failed";
}

/**
 * Tap to start, tap to stop, with a hard 30-second cap. Hands the finished
 * WAV to `onRecorded`.
 */
export function useRecorder(onRecorded: (wav: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<MessageKey | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set from the first tap until recording starts, so a double tap can't open two microphones.
  const starting = useRef(false);
  // Cleared on unmount: a recording stopped by leaving the page is never sent.
  const mounted = useRef(true);
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (starting.current || recorder.current?.state === "recording") return;
    // Checked on tap, not at render: the button is in the server HTML and works
    // as soon as the page hydrates, and an old browser gets a reason, not a gap.
    if (!canRecord()) {
      setError(micError(new DOMException("No MediaRecorder", "NotSupportedError")));
      return;
    }
    starting.current = true;
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      starting.current = false;
      setError(micError(e));
      return;
    }
    if (!mounted.current) {
      starting.current = false;
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    const chunks: Blob[] = [];
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream);
    } catch (e) {
      // Don't leave the microphone switched on when we can't use it.
      for (const track of stream.getTracks()) track.stop();
      starting.current = false;
      setError(micError(e));
      return;
    }
    recorder.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = async () => {
      for (const track of stream.getTracks()) track.stop();
      recorder.current = null;
      if (!mounted.current) return;
      setState("processing");
      try {
        const wav = await toWav(new Blob(chunks, { type: rec.mimeType }));
        onRecordedRef.current(wav);
      } catch {
        setError("mic.processFailed");
      } finally {
        setState("idle");
        setSeconds(0);
      }
    };
    rec.start();
    starting.current = false;
    setState("recording");
    setSeconds(0);
    const started = Date.now();
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS) stop();
    }, 250);
  }, [stop]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);

  return { state, seconds, error, start, stop };
}

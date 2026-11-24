"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TARGET_RATE, encodeWav, resample } from "@/lib/audio/wav";
import type { MessageKey } from "@/lib/i18n/en";

import { NoSpeechError, transcribe } from "./api";

export const MAX_SECONDS = 45;
/**
 * How often the growing recording is re-transcribed while the trader talks,
 * and at most how many times: each update is a paid speech request.
 */
const LIVE_EVERY_MS = 4_000;
const MAX_LIVE_UPDATES = 6;
/** Below this peak level the microphone heard nothing useful. */
const SILENT_PEAK = 0.02;

export type RecorderState = "idle" | "recording" | "finishing";

type Ctx = AudioContext & { webkitAudioContext?: never };

const canRecord = () =>
  typeof window !== "undefined" &&
  typeof window.AudioContext !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

/** Which message to show for a failed recording, as a key for the interface language. */
export function micError(error: unknown): MessageKey {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "mic.blocked";
  if (name === "NotFoundError") return "mic.notFound";
  if (name === "NotSupportedError" || name === "NotReadableError") return "mic.unsupported";
  return "mic.failed";
}

function join(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

interface Session {
  stream: MediaStream;
  ctx: Ctx;
  node: ScriptProcessorNode;
  chunks: Float32Array[];
  rate: number;
  peak: number;
  /** Sample count already sent for live transcription. */
  sentLength: number;
  inFlight: boolean;
  liveCount: number;
  timer: ReturnType<typeof setInterval>;
  started: number;
}

const wavOf = (s: Session) =>
  new Blob([encodeWav(resample(join(s.chunks), s.rate, TARGET_RATE), TARGET_RATE)], {
    type: "audio/wav",
  });

/**
 * Live voice notes. Samples the microphone directly (no MediaRecorder file to
 * decode, which is where silent recordings came from), shows a level meter,
 * re-transcribes every few seconds so the words appear while the trader
 * talks, and gives a final transcript on stop.
 */
export function useLiveRecorder(opts: {
  language: "lug" | "eng";
  onInterim: (text: string) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<MessageKey | null>(null);
  const session = useRef<Session | null>(null);
  const starting = useRef(false);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const release = useCallback((s: Session) => {
    clearInterval(s.timer);
    s.node.onaudioprocess = null;
    s.node.disconnect();
    for (const track of s.stream.getTracks()) track.stop();
    void s.ctx.close();
  }, []);

  /** Re-transcribes everything so far, one request at a time. */
  const live = useCallback(async (s: Session) => {
    const length = s.chunks.reduce((n, c) => n + c.length, 0);
    if (s.inFlight || s.liveCount >= MAX_LIVE_UPDATES) return;
    if (length - s.sentLength < s.rate * 2 || s.peak < SILENT_PEAK) return;
    s.inFlight = true;
    s.liveCount += 1;
    s.sentLength = length;
    try {
      const text = await transcribe(wavOf(s), optsRef.current.language);
      if (session.current === s) optsRef.current.onInterim(text);
    } catch {
      // A live update failing is fine: the final transcript on stop is what counts.
    } finally {
      s.inFlight = false;
    }
  }, []);

  /** Stops listening and resolves with the final transcript (null if nothing usable). */
  const stop = useCallback(async (): Promise<string | null> => {
    const s = session.current;
    if (!s) return null;
    session.current = null;
    release(s);
    setLevel(0);
    if (s.peak < SILENT_PEAK) {
      setState("idle");
      setError("mic.silent");
      return null;
    }
    setState("finishing");
    try {
      return await transcribe(wavOf(s), optsRef.current.language);
    } catch (e) {
      setError(e instanceof NoSpeechError ? "mic.noWords" : "mic.transcribeFailed");
      return null;
    } finally {
      setState("idle");
      setSeconds(0);
    }
  }, [release]);

  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = useCallback(async () => {
    if (starting.current || session.current) return;
    // Checked on tap, not at render, so an old browser gets a reason, not a gap.
    if (!canRecord()) {
      setError("mic.unsupported");
      return;
    }
    starting.current = true;
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      starting.current = false;
      setError(micError(e));
      return;
    }
    try {
      const ctx = new AudioContext() as Ctx;
      await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated but works everywhere without a separate worklet file.
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      source.connect(node);
      node.connect(mute);
      mute.connect(ctx.destination);
      const s: Session = {
        stream,
        ctx,
        node,
        chunks: [],
        rate: ctx.sampleRate,
        peak: 0,
        sentLength: 0,
        inFlight: false,
        liveCount: 0,
        started: Date.now(),
        timer: setInterval(() => {
          const elapsed = (Date.now() - s.started) / 1000;
          setSeconds(Math.floor(elapsed));
          if (elapsed >= MAX_SECONDS) void stopRef.current();
          else if (Date.now() - s.started >= LIVE_EVERY_MS * (s.liveCount + 1)) void live(s);
        }, 500),
      };
      let lastLevel = 0;
      node.onaudioprocess = (e) => {
        const data = new Float32Array(e.inputBuffer.getChannelData(0));
        s.chunks.push(data);
        let sum = 0;
        let peak = 0;
        for (const v of data) {
          sum += v * v;
          peak = Math.max(peak, Math.abs(v));
        }
        s.peak = Math.max(s.peak, peak);
        const rms = Math.min(1, Math.sqrt(sum / data.length) * 6);
        if (Math.abs(rms - lastLevel) > 0.04) {
          lastLevel = rms;
          setLevel(rms);
        }
      };
      session.current = s;
      setSeconds(0);
      setState("recording");
    } catch (e) {
      for (const track of stream.getTracks()) track.stop();
      setError(micError(e));
    } finally {
      starting.current = false;
    }
  }, [live]);

  // Leaving the page never sends a half-finished recording.
  useEffect(
    () => () => {
      const s = session.current;
      session.current = null;
      if (s) release(s);
    },
    [release],
  );

  return { state, seconds, level, error, clearError: () => setError(null), start, stop };
}

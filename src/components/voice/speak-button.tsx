"use client";

import { Loader2, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SpeechPiece } from "@/lib/answer/types";
import { TARGET_RATE, encodeWav } from "@/lib/audio/wav";

import { speak } from "./api";

type State = "idle" | "loading" | "playing";

// Clips fetched in this tab, so replay is instant and free. Capped: each is a
// WAV of up to ~1 MB.
const CACHE_SIZE = 24;
const clips = new Map<string, Promise<Blob>>();

function clip(piece: SpeechPiece): Promise<Blob> {
  const cached = clips.get(piece.text);
  if (cached) {
    clips.delete(piece.text);
    clips.set(piece.text, cached);
    return cached;
  }
  const pending = speak(piece).catch((error: unknown) => {
    clips.delete(piece.text);
    throw error;
  });
  clips.set(piece.text, pending);
  if (clips.size > CACHE_SIZE) {
    const oldest = clips.keys().next().value;
    if (oldest !== undefined) clips.delete(oldest);
  }
  return pending;
}

// 10 ms of silence. Playing it inside the tap "unlocks" the audio element on
// iOS Safari, which otherwise refuses to play once we've awaited a fetch.
let silence: string | null = null;
function silentClip(): string {
  silence ??= URL.createObjectURL(
    new Blob([encodeWav(new Float32Array(160), TARGET_RATE)], { type: "audio/wav" }),
  );
  return silence;
}

// Only one answer speaks at a time across the page.
let stopActive: (() => void) | null = null;

/**
 * Reads Luganda aloud. The pieces were split and signed by the server; all are
 * requested at once (each takes a few seconds to make) and played in order on a
 * single audio element.
 */
export function SpeakButton({ pieces, label }: { pieces: SpeechPiece[]; label: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const player = useRef<HTMLAudioElement | null>(null);
  // Settles the clip that is playing, so stopping never leaves a promise or URL behind.
  const finish = useRef<(() => void) | null>(null);

  function halt() {
    run.current += 1;
    player.current?.pause();
    finish.current?.();
    finish.current = null;
  }

  function stop() {
    halt();
    if (stopActive === stop) stopActive = null;
    setState("idle");
  }

  useEffect(() => {
    const runs = run;
    const audio = player;
    const done = finish;
    return () => {
      runs.current += 1;
      audio.current?.pause();
      done.current?.();
    };
  }, []);

  function playOne(el: HTMLAudioElement, blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve, reject) => {
      finish.current = resolve;
      el.onended = () => resolve();
      el.onerror = () => reject(new Error("Playback failed"));
      el.src = url;
      el.play().catch(reject);
    }).finally(() => {
      finish.current = null;
      URL.revokeObjectURL(url);
    });
  }

  async function play() {
    if (state !== "idle") return stop();
    stopActive?.();
    stopActive = stop;

    // Created and started inside the tap, then reused for every piece.
    const el = player.current ?? new Audio();
    player.current = el;
    el.src = silentClip();
    void el.play().catch(() => {});

    const id = ++run.current;
    setError(null);
    setState("loading");
    const pending = pieces.map(clip);
    try {
      for (const next of pending) {
        const blob = await next;
        if (run.current !== id) return;
        setState("playing");
        await playOne(el, blob);
        if (run.current !== id) return;
      }
    } catch (e) {
      if (run.current === id) setError(e instanceof Error ? e.message : "Playback failed.");
    }
    if (run.current === id) {
      if (stopActive === stop) stopActive = null;
      setState("idle");
    }
  }

  if (pieces.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void play()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
        aria-label={state === "idle" ? label : `Stop: ${label}`}
        data-state={state}
      >
        {state === "loading" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : state === "playing" ? (
          <Square className="size-3.5" aria-hidden />
        ) : (
          <Volume2 className="size-3.5" aria-hidden />
        )}
        {state === "loading" ? "Preparing audio…" : state === "playing" ? "Stop" : label}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}

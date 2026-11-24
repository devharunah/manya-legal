"use client";

import { ArrowUp, MapPin, Pencil, Store } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import type { Answer } from "@/lib/answer/types";
import { DEMO_PROFILE } from "@/lib/profile";
import { useLanguage } from "@/lib/use-language";
import { useIsDemo, useProfile } from "@/lib/use-profile";

import { AnswerCard, type Translation } from "./answer-card";
import { answerToLuganda, questionToEnglish } from "./voice/api";
import { MicButton } from "./voice/mic-button";

export const SUGGESTIONS = [
  "What do I need to legally operate my retail shop in Kampala?",
  "What could happen if I operate my shop without the required trading licence?",
  "My trading licence is expiring. What should I do?",
  "How much does a trading licence cost?",
];

interface Turn {
  id: number;
  question: string;
  /** What we searched our sources for, when the question was asked in Luganda. */
  english?: string;
  stage?: "translating" | "answering";
  answer?: Answer;
  translation?: Translation;
  error?: string;
}

const failMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Asks our checked English pipeline. Returns the answer, or an error message for the trader. */
async function fetchAnswer(
  question: string,
  profile: unknown,
): Promise<Answer | { error: string }> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, profile }),
  });
  return res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : { error: "The service is busy right now. Please try your question again in a moment." };
}

export function AskView({ voice = false }: { voice?: boolean }) {
  const { profile, loaded, save } = useProfile();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [storedLang, setLang] = useLanguage();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Luganda needs the speech service for translation; without it, English only.
  const lang = voice ? storedLang : "en";
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const isDemo = useIsDemo();

  // "Try the demo" lands here with ?demo=1: use the Kikuubo retailer profile.
  useEffect(() => {
    if (loaded && !profile && isDemo) save(DEMO_PROFILE);
  }, [loaded, profile, isDemo, save]);

  const turnCount = turns.length;
  useEffect(() => {
    if (turnCount > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnCount]);

  function update(id: number, patch: Partial<Turn>) {
    setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));
  }

  /** Runs after the English answer is on screen, so the trader never waits on it. */
  async function translateAnswer(id: number, answer: Answer) {
    const pending = answerToLuganda(answer);
    if (!pending) return;
    update(id, { translation: { status: "loading" } });
    try {
      const result = await pending;
      update(id, { translation: { status: "ready", ...result } });
    } catch (e) {
      update(id, {
        translation: {
          status: "failed",
          error: failMessage(e, "The Luganda version isn't available right now."),
        },
      });
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy || !profile) return;
    nextId.current += 1;
    const id = nextId.current;
    const luganda = lang === "lug";
    setTurns((t) => [...t, { id, question: q, stage: luganda ? "translating" : "answering" }]);
    setInput("");
    setVoiceError(null);
    setBusy(true);
    try {
      // Our sources and refusal gate work in English, so a Luganda question is
      // translated first and the trader sees what we actually searched for.
      let english = q;
      if (luganda) {
        try {
          english = await questionToEnglish(q);
        } catch (e) {
          update(id, { error: failMessage(e, "We couldn't translate your question.") });
          return;
        }
        update(id, { english, stage: "answering" });
      }
      const data = await fetchAnswer(english, profile);
      if ("error" in data) {
        update(id, { error: data.error });
        return;
      }
      update(id, { answer: data });
      if (luganda) void translateAnswer(id, data);
    } catch {
      update(id, { error: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  if (loaded && !profile && !isDemo) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Store className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-brand-900">
          First, your business
        </h1>
        <p className="mt-3 text-muted">
          Answers depend on what you sell and where. Tell us in under a minute, or try the demo as a
          Kikuubo retailer.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/onboard"
            className="rounded-xl bg-brand-800 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Set up my business
          </Link>
          <button
            type="button"
            onClick={() => save(DEMO_PROFILE)}
            className="rounded-xl border border-line bg-white px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50"
          >
            Use the demo profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Answering for
              </p>
              <p className="mt-1 font-semibold text-ink">
                {profile?.businessName || profile?.category || "…"}
              </p>
            </div>
            <Link
              href="/onboard"
              className="rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-brand-800"
              aria-label="Edit business profile"
            >
              <Pencil className="size-4" />
            </Link>
          </div>
          {profile && (
            <dl className="mt-3 space-y-1.5 text-sm text-muted">
              <dd className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden /> {profile.location}
              </dd>
              <dd>{profile.category}</dd>
              <dd>{profile.registration}</dd>
              <dd>{profile.licence}</dd>
            </dl>
          )}
        </div>
        <div className="hidden rounded-2xl border border-line bg-white p-4 text-xs leading-5 text-muted shadow-sm lg:block">
          <p className="font-semibold text-ink">What we cover today</p>
          <p className="mt-1">
            Trading licences, business registration (URSB), TIN and related compliance for small
            traders, starting with Kampala. Other areas of law are coming.
          </p>
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col">
        {turns.length === 0 ? (
          <div className="flex-1 pt-2 lg:pt-6">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
              What would you like to know?
            </h1>
            <p className="mt-2 text-muted">
              Ask in your own words. Here are questions traders often have:
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  disabled={!profile}
                  className="rounded-2xl border border-line bg-white p-4 text-left text-[15px] leading-6 text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-8 pb-6">
            {turns.map((turn) => (
              <div key={turn.id} className="space-y-4">
                <div className="flex flex-col items-end gap-1.5">
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-800 px-4 py-3 text-white shadow-sm">
                    {turn.question}
                  </p>
                  {turn.english && turn.english !== turn.question && (
                    <p
                      className="max-w-[85%] text-right text-xs text-muted"
                      data-testid="understood"
                    >
                      We searched our sources for: <em>{turn.english}</em>
                    </p>
                  )}
                </div>
                {turn.answer ? (
                  <AnswerCard
                    answer={turn.answer}
                    voice={voice}
                    {...(turn.translation ? { translation: turn.translation } : {})}
                  />
                ) : turn.error ? (
                  <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                    {turn.error}
                  </p>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-muted shadow-sm">
                    <span className="flex gap-1" aria-hidden>
                      <span className="dot size-2 rounded-full bg-brand-500" />
                      <span className="dot size-2 rounded-full bg-brand-500" />
                      <span className="dot size-2 rounded-full bg-brand-500" />
                    </span>
                    {turn.stage === "translating"
                      ? "Translating your question into English to search our sources…"
                      : "Checking official sources and writing a plain answer…"}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <form
          onSubmit={submit}
          className="sticky bottom-0 -mx-4 mt-4 border-t border-line bg-paper/90 px-4 pt-3 pb-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:p-2 sm:shadow-lg"
        >
          {voice && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <fieldset className="inline-flex rounded-xl bg-brand-50 p-1 text-xs font-semibold">
                <legend className="sr-only">Answer language</legend>
                {(["en", "lug"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    onClick={() => setLang(l)}
                    className={`rounded-lg px-3 py-1 transition ${lang === l ? "bg-white text-brand-900 shadow-sm" : "text-brand-700/70"}`}
                  >
                    {l === "lug" ? "Oluganda" : "English"}
                  </button>
                ))}
              </fieldset>
              <span className="text-[11px] text-muted">
                Tap the microphone to ask in Luganda (up to 30 seconds).
              </span>
            </div>
          )}
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <div className="flex items-end gap-2">
            {voice && (
              <MicButton
                disabled={busy || !profile}
                onError={setVoiceError}
                onTranscript={(text) => {
                  // The trader reads and can fix this before anything is asked.
                  setInput(text);
                  setLang("lug");
                }}
              />
            )}
            <textarea
              id="question"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="e.g. Can KCCA close my shop if my licence has expired?"
              maxLength={500}
              className="max-h-40 min-h-12 flex-1 resize-none rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 sm:border-0 sm:focus:ring-0"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length < 3 || !profile}
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-800 text-white transition hover:bg-brand-700 disabled:bg-brand-200"
              aria-label="Ask"
            >
              <ArrowUp className="size-5" />
            </button>
          </div>
          {voiceError && (
            <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {voiceError}
            </p>
          )}
          <p className="mt-2 px-1 text-[11px] text-muted">
            Legal information, not legal advice. Don&apos;t share ID numbers or other personal
            details.
            {voice &&
              " Voice notes and Luganda text are sent to Sunbird AI to transcribe and translate; Sunbird may keep a copy. We don't store them."}
          </p>
        </form>
      </section>
    </div>
  );
}

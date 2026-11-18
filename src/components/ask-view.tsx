"use client";

import { ArrowUp, MapPin, Pencil, Store } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import type { Answer } from "@/lib/answer/types";
import { DEMO_PROFILE } from "@/lib/profile";
import { useIsDemo, useProfile } from "@/lib/use-profile";

import { AnswerCard } from "./answer-card";

export const SUGGESTIONS = [
  "What do I need to legally operate my retail shop in Kampala?",
  "What could happen if I operate my shop without the required trading licence?",
  "My trading licence is expiring. What should I do?",
  "How much does a trading licence cost?",
];

interface Turn {
  id: number;
  question: string;
  answer?: Answer;
  error?: string;
}

export function AskView() {
  const { profile, loaded, save } = useProfile();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
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

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy || !profile) return;
    nextId.current += 1;
    const id = nextId.current;
    setTurns((t) => [...t, { id, question: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, profile }),
      });
      const data: Answer | { error: string } = res.headers
        .get("content-type")
        ?.includes("application/json")
        ? await res.json()
        : { error: "The service is busy right now. Please try your question again in a moment." };
      setTurns((t) =>
        t.map((turn) =>
          turn.id === id
            ? "error" in data
              ? { ...turn, error: data.error }
              : { ...turn, answer: data }
            : turn,
        ),
      );
    } catch {
      setTurns((t) =>
        t.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                error: "We couldn't reach the server. Check your connection and try again.",
              }
            : turn,
        ),
      );
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
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-800 px-4 py-3 text-white shadow-sm">
                    {turn.question}
                  </p>
                </div>
                {turn.answer ? (
                  <AnswerCard answer={turn.answer} />
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
                    Checking official sources and writing a plain answer…
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
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <div className="flex items-end gap-2">
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
          <p className="mt-2 px-1 text-[11px] text-muted">
            Legal information, not legal advice. Don&apos;t share ID numbers or other personal
            details.
          </p>
        </form>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

import { PhoneEmulator } from "./phone-emulator";

const CODES = [
  ["*245#", "Main menu"],
  ["*245*1#", "Report a dispute"],
  ["*245*2#", "My cases"],
  ["*245*3#", "Know your options"],
  ["*245*3*4#", "Small claims, straight in"],
  ["*245*4#", "Get legal help"],
  ["*245*5*2#", "Switch to Oluganda"],
] as const;

/** The phone, with a quick-reference card of codes a presenter can tap to type. */
export function EmulatorScreen() {
  const [typed, setTyped] = useState<{ code: string; n: number }>();

  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <h1 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
            MANYA on any phone
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-3">
            Prototype: a simulated USSD menu for traders without a smartphone or internet. Demo
            short code, sample data. Nothing is sent or saved.
          </p>
        </header>

        <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
          <PhoneEmulator {...(typed ? { typed } : {})} />

          <aside className="w-full max-w-sm rounded-2xl border border-line bg-paper p-5 shadow-sm">
            <h2 className="font-semibold text-ink">Quick codes</h2>
            <p className="mt-1 text-xs text-ink-3">Tap a code to type it, then press call.</p>
            <ul className="mt-4 space-y-1.5">
              {CODES.map(([code, label]) => (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => setTyped((t) => ({ code, n: (t?.n ?? 0) + 1 }))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-tint"
                  >
                    <span className="font-mono font-semibold text-brand-700">{code}</span>
                    <span className="text-ink-2">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 font-semibold text-ink">In any menu</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-mono font-semibold text-brand-700">0</dt>
              <dd className="text-ink-2">Back (exit on the main menu)</dd>
              <dt className="font-mono font-semibold text-brand-700">00</dt>
              <dd className="text-ink-2">Main menu</dd>
              <dt className="font-mono font-semibold text-brand-700">Enter</dt>
              <dd className="text-ink-2">Send, or call from the dial pad</dd>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

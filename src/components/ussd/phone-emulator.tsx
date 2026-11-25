"use client";

import { MessageSquare, Signal, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Reply, type Session, dial, respond } from "@/lib/ussd/engine";
import type { Lang } from "@/lib/ussd/messages";
import type { MockCase } from "@/lib/ussd/mock";

import { Keypad } from "./keypad";
import { UssdDialog, UssdRunning } from "./ussd-dialog";

/** How long the "network" takes to answer, so it feels like a real USSD session. */
const NETWORK_MS = 600;
const UNKNOWN_CODE = "Connection problem or invalid MMI code.";

type Mode =
  | { kind: "dialer" }
  | { kind: "running" }
  | { kind: "screen"; session: Session | null; reply: Pick<Reply, "text" | "end" | "expect"> };

/**
 * A basic phone that dials MANYA's USSD menu. Everything runs here in the
 * browser on sample data: nothing is sent to a network or saved.
 */
export function PhoneEmulator({ typed }: { typed?: { code: string; n: number } }) {
  const [number, setNumber] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "dialer" });
  const [lang, setLang] = useState<Lang>("en");
  const [cases, setCases] = useState<MockCase[]>([]);
  const [sms, setSms] = useState<string | null>(null);
  /** Counts screens, so each one opens a fresh reply box. */
  const [screenN, setScreenN] = useState(0);
  const [typedN, setTypedN] = useState(typed?.n);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const smsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(smsTimer.current);
    },
    [],
  );

  // A code tapped in the quick-reference card is typed into the dialer.
  if (typed && typed.n !== typedN) {
    setTypedN(typed.n);
    setNumber(typed.code);
    if (mode.kind === "screen") setMode({ kind: "dialer" });
  }

  const after = useCallback((fn: () => void) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, NETWORK_MS);
  }, []);

  const show = useCallback((session: Session, reply: Reply) => {
    setLang(reply.lang);
    setMode({ kind: "screen", session: reply.end ? null : session, reply });
    setScreenN((n) => n + 1);
    if (reply.created) {
      const created = reply.created;
      setCases((c) => [created, ...c]);
    }
    if (reply.sms) {
      const text = reply.sms;
      clearTimeout(smsTimer.current);
      smsTimer.current = setTimeout(() => setSms(text), NETWORK_MS * 2);
    }
  }, []);

  const call = useCallback(() => {
    if (!number) return;
    setMode({ kind: "running" });
    after(() => {
      const step = dial(number, { lang, cases });
      if (step) show(step.session, step.reply);
      else {
        setMode({
          kind: "screen",
          session: null,
          reply: { text: UNKNOWN_CODE, end: true, expect: "choice" },
        });
        setScreenN((n) => n + 1);
      }
    });
  }, [after, cases, lang, number, show]);

  const send = (input: string) => {
    if (mode.kind !== "screen" || !mode.session) return;
    const session = mode.session;
    setMode({ kind: "running" });
    after(() => {
      const step = respond(session, input);
      show(step.session, step.reply);
    });
  };

  const close = () => {
    clearTimeout(timer.current);
    setMode({ kind: "dialer" });
    setNumber("");
  };

  // Typing on a computer keyboard works on the dial pad too.
  useEffect(() => {
    if (mode.kind !== "dialer") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      if (/^[0-9*#]$/.test(e.key)) setNumber((n) => (n + e.key).slice(0, 20));
      else if (e.key === "Backspace") setNumber((n) => n.slice(0, -1));
      else if (e.key === "Enter") call();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, mode.kind]);

  return (
    <section
      aria-label="Simulated phone"
      className="relative h-[680px] w-[330px] shrink-0 rounded-[52px] bg-[#16161a] p-3 shadow-2xl ring-1 ring-black/40"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] bg-[#0b0b0f] text-white">
        <StatusBar />
        {sms && <SmsBanner text={sms} onClose={() => setSms(null)} />}

        <div className="flex flex-1 flex-col justify-end px-6 pt-10 pb-4 text-center">
          <p
            data-testid="dialed"
            className="min-h-10 font-mono text-[30px] tracking-wide break-all text-white"
          >
            {number}
          </p>
          <p className="mt-2 text-xs text-white/50">{number ? " " : "Dial *245# for MANYA"}</p>
        </div>

        <Keypad
          onKey={(k) => setNumber((n) => (n + k).slice(0, 20))}
          onCall={call}
          onDelete={() => setNumber((n) => n.slice(0, -1))}
        />
        <div className="mx-auto mb-2 h-1 w-28 rounded-full bg-white/40" />

        {mode.kind === "running" && <UssdRunning />}
        {mode.kind === "screen" && (
          <UssdDialog
            key={screenN}
            text={mode.reply.text}
            end={mode.reply.end}
            expect={mode.reply.expect}
            onSend={send}
            onClose={close}
          />
        )}
      </div>
    </section>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-3 text-[13px] font-semibold">
      <span>9:41</span>
      <span className="h-6 w-24 rounded-full bg-black" aria-hidden />
      <span className="flex items-center gap-1.5">
        <Signal className="size-3.5" aria-hidden />
        <span className="text-[11px]">MTN</span>
        <WifiOff className="size-3.5 text-white/60" aria-label="No internet" />
      </span>
    </div>
  );
}

function SmsBanner({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <output
      aria-label="SMS"
      className="absolute block inset-x-3 top-10 z-30 rounded-2xl bg-white/95 p-3 text-left text-[13px] text-[#111] shadow-xl"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#555]">
        <MessageSquare className="size-3.5 text-[#22c55e]" aria-hidden />
        MESSAGES · MANYA · now
        <button
          type="button"
          aria-label="Dismiss SMS"
          onClick={onClose}
          className="ml-auto rounded p-0.5 hover:bg-black/5"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <p className="mt-1 leading-snug">{text}</p>
    </output>
  );
}

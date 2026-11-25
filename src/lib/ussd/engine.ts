import { type Lang, say } from "./messages";
import {
  FIRST_NEW_REFERENCE,
  HELP_CONTACTS,
  LEGAL_OPTIONS,
  type MockCase,
  SAMPLE_CASES,
} from "./mock";

/**
 * The USSD menu as a pure state machine, for the offline-access prototype.
 * It runs entirely in the browser on sample data: nothing is sent or saved.
 * A screen either continues ("CON", waits for a reply) or ends ("END").
 */

export const SHORT_CODE = "*245#";
/** A USSD screen holds about 182 characters. */
export const SCREEN_LIMIT = 182;

const REPORT_STEPS = [
  "supplier",
  "goods",
  "amount",
  "paid",
  "delivery",
  "agreement",
  "want",
  "confirm",
] as const;
type ReportStep = (typeof REPORT_STEPS)[number];

/** Number of choices offered on each multiple-choice report step. */
const CHOICES: Partial<Record<ReportStep, number>> = {
  paid: 4,
  delivery: 3,
  agreement: 3,
  want: 3,
  confirm: 2,
};

export type Screen =
  | { id: "home" }
  | { id: "report"; step: ReportStep }
  | { id: "cases" }
  | { id: "case"; index: number }
  | { id: "options" }
  | { id: "option"; index: number }
  | { id: "help" }
  | { id: "contact"; index: number }
  | { id: "language" };

export interface Draft {
  supplier?: string;
  goods?: string;
  amount?: number;
  choices?: Partial<Record<ReportStep, number>>;
}

export interface Session {
  lang: Lang;
  screen: Screen;
  /** Screens to return to with "0". */
  trail: Screen[];
  draft: Draft;
  /** Sample cases plus any reported in this emulator, newest first. */
  cases: MockCase[];
}

/** What kind of reply the open screen expects, so the phone can pick a keyboard. */
export type Expect = "choice" | "text" | "number";

export interface Reply {
  end: boolean;
  text: string;
  expect: Expect;
  /** An SMS the phone receives after the session ends. */
  sms?: string;
  /** A case reported in this session, for the phone to remember. */
  created?: MockCase;
  lang: Lang;
}

export interface Step {
  session: Session;
  reply: Reply;
}

export const formatUgx = (n: number) => n.toLocaleString("en-US");

const numbered = (title: string, items: readonly string[], footer: string) =>
  [title, ...items.map((item, i) => `${i + 1}. ${item}`), footer].join("\n");

function screenText(s: Session): { text: string; expect: Expect } {
  const { lang, screen } = s;
  switch (screen.id) {
    case "home":
      return { text: say(lang, "home"), expect: "choice" };
    case "language":
      return { text: say(lang, "language"), expect: "choice" };
    case "report": {
      if (screen.step === "confirm") {
        return {
          text: say(lang, "confirm", {
            supplier: s.draft.supplier ?? "",
            goods: s.draft.goods ?? "",
            amount: formatUgx(s.draft.amount ?? 0),
          }),
          expect: "choice",
        };
      }
      const expect: Expect =
        screen.step === "amount" ? "number" : screen.step in CHOICES ? "choice" : "text";
      return { text: say(lang, screen.step), expect };
    }
    case "cases":
      return s.cases.length === 0
        ? { text: `${say(lang, "noCases")}\n${say(lang, "back")}`, expect: "choice" }
        : {
            text: numbered(
              say(lang, "cases"),
              s.cases.slice(0, 4).map((c) => `${c.reference} ${c.supplier}`),
              say(lang, "back"),
            ),
            expect: "choice",
          };
    case "case": {
      const c = s.cases[screen.index];
      return {
        text: `${say(lang, "caseDetail", {
          ref: c?.reference ?? "",
          supplier: c?.supplier ?? "",
          goods: c?.goods ?? "",
          amount: formatUgx(c?.amount ?? 0),
          status: c?.status ?? "",
          next: c?.next ?? "",
        })}\n${say(lang, "nav")}`,
        expect: "choice",
      };
    }
    case "options":
      return {
        text: numbered(
          say(lang, "options"),
          LEGAL_OPTIONS.map((o) => o.title),
          say(lang, "back"),
        ),
        expect: "choice",
      };
    case "option":
      return {
        text: `${LEGAL_OPTIONS[screen.index]?.text ?? ""}\n${say(lang, "nav")}`,
        expect: "choice",
      };
    case "help":
      return {
        text: numbered(
          say(lang, "help"),
          HELP_CONTACTS.map((h) => h.name),
          say(lang, "back"),
        ),
        expect: "choice",
      };
    case "contact": {
      const h = HELP_CONTACTS[screen.index];
      return {
        text: `${h?.name ?? ""}\n${h?.contact ?? ""}\n${h?.status ?? ""}\n${say(lang, "nav")}`,
        expect: "choice",
      };
    }
  }
}

const show = (session: Session, error = false): Step => {
  const { text, expect } = screenText(session);
  return {
    session,
    reply: {
      end: false,
      text: error ? `${say(session.lang, "invalid")}\n${text}` : text,
      expect,
      lang: session.lang,
    },
  };
};

const end = (session: Session, text: string, extra: Partial<Reply> = {}): Step => ({
  session,
  reply: { end: true, text, expect: "choice", lang: session.lang, ...extra },
});

const go = (s: Session, screen: Screen): Step =>
  show({ ...s, screen, trail: [...s.trail, s.screen] });

/** Picks item n (1-based) of a list of length `count`, or null. */
const pick = (input: string, count: number): number | null => {
  if (!/^\d+$/.test(input)) return null;
  const n = Number(input);
  return n >= 1 && n <= count ? n : null;
};

const nextStep = (step: ReportStep): ReportStep =>
  REPORT_STEPS[REPORT_STEPS.indexOf(step) + 1] ?? "confirm";

function answerReport(s: Session, step: ReportStep, input: string): Step {
  const choices = CHOICES[step];
  if (choices !== undefined) {
    const n = pick(input, choices);
    if (n === null) return show(s, true);
    if (step === "confirm") return n === 1 ? submit(s) : end(s, say(s.lang, "cancelled"));
    const draft = { ...s.draft, choices: { ...s.draft.choices, [step]: n } };
    return go({ ...s, draft }, { id: "report", step: nextStep(step) });
  }
  if (step === "amount") {
    const digits = input.replace(/[,\s]/g, "");
    const amount = /^\d{1,12}$/.test(digits) ? Number(digits) : 0;
    if (amount <= 0) return show(s, true);
    return go({ ...s, draft: { ...s.draft, amount } }, { id: "report", step: nextStep(step) });
  }
  const text = input.trim().slice(0, 60);
  if (text.length < 2) return show(s, true);
  return go({ ...s, draft: { ...s.draft, [step]: text } }, { id: "report", step: nextStep(step) });
}

function submit(s: Session): Step {
  const created = s.cases.filter((c) => !SAMPLE_CASES.includes(c)).length;
  const reference = `MNY-${String(FIRST_NEW_REFERENCE + created).padStart(4, "0")}`;
  const newCase: MockCase = {
    reference,
    supplier: s.draft.supplier ?? "",
    goods: s.draft.goods ?? "",
    amount: s.draft.amount ?? 0,
    status: "Reported by USSD",
    next: "Choose an option: dial *245*3#",
  };
  const vars = {
    ref: reference,
    supplier: newCase.supplier,
    amount: formatUgx(newCase.amount),
  };
  return end({ ...s, cases: [newCase, ...s.cases] }, say(s.lang, "saved", vars), {
    sms: say(s.lang, "sms", vars),
    created: newCase,
  });
}

function choose(s: Session, input: string): Step {
  const { screen } = s;
  switch (screen.id) {
    case "home": {
      if (input === "0") return end(s, say(s.lang, "bye"));
      const n = pick(input, 5);
      if (n === null) return show(s, true);
      const targets: Screen[] = [
        { id: "report", step: "supplier" },
        { id: "cases" },
        { id: "options" },
        { id: "help" },
        { id: "language" },
      ];
      return go(s, targets[n - 1] ?? { id: "home" });
    }
    case "language": {
      const n = pick(input, 2);
      if (n === null) return show(s, true);
      const lang: Lang = n === 1 ? "en" : "lug";
      const home = show({ ...s, lang, screen: { id: "home" }, trail: [] });
      return {
        ...home,
        reply: { ...home.reply, text: `${say(lang, "languageSet")}\n${home.reply.text}` },
      };
    }
    case "report":
      return answerReport(s, screen.step, input);
    case "cases": {
      const n = pick(input, Math.min(s.cases.length, 4));
      return n === null ? show(s, true) : go(s, { id: "case", index: n - 1 });
    }
    case "options": {
      const n = pick(input, LEGAL_OPTIONS.length);
      return n === null ? show(s, true) : go(s, { id: "option", index: n - 1 });
    }
    case "help": {
      const n = pick(input, HELP_CONTACTS.length);
      return n === null ? show(s, true) : go(s, { id: "contact", index: n - 1 });
    }
    case "case":
    case "option":
    case "contact":
      return show(s, true);
  }
}

/** Handles one reply typed into the open USSD screen. */
export function respond(session: Session, raw: string): Step {
  const input = raw.trim();
  if (input === "00") return show({ ...session, screen: { id: "home" }, trail: [] });
  if (input === "0" && session.screen.id !== "home") {
    const previous = session.trail.at(-1);
    if (previous) return show({ ...session, screen: previous, trail: session.trail.slice(0, -1) });
  }
  return choose(session, input);
}

/** Matches *245# and shortcuts such as *245*3*4#, which answer the first menus for you. */
const DIAL = /^\*245((?:\*\d+)*)#$/;

export const isShortCode = (code: string) => DIAL.test(code.trim());

/**
 * Dials a code. Returns null for a code MANYA doesn't answer, like a real
 * network replying "Unknown application".
 */
export function dial(
  code: string,
  { lang = "en", cases = [] }: { lang?: Lang; cases?: readonly MockCase[] } = {},
): Step | null {
  const match = DIAL.exec(code.trim());
  if (!match) return null;
  let step = show({
    lang,
    screen: { id: "home" },
    trail: [],
    draft: {},
    cases: [...cases, ...SAMPLE_CASES],
  });
  for (const part of (match[1] ?? "").split("*").filter(Boolean)) {
    if (step.reply.end) break;
    step = respond(step.session, part);
  }
  return step;
}

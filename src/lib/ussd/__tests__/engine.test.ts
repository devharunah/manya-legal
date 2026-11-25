import { knownChunk } from "@/lib/resolve/pathways";

import { SCREEN_LIMIT, type Step, dial, isShortCode, respond } from "../engine";
import { HELP_CONTACTS, LEGAL_OPTIONS, SAMPLE_CASES } from "../mock";

const start = (code = "*245#", opts = {}): Step => {
  const step = dial(code, opts);
  if (!step) throw new Error(`no answer for ${code}`);
  return step;
};

const answer = (step: Step, ...inputs: string[]): Step =>
  inputs.reduce((s, input) => respond(s.session, input), step);

/** Main menu 1, then the seven answers: the next screen is the confirmation. */
const REPORT = ["1", "Okello Traders", "50 bags of sugar", "2,500,000", "1", "1", "3", "1"];

describe("dialling", () => {
  it("opens the main menu on *245#", () => {
    const { reply } = start();
    expect(reply.end).toBe(false);
    expect(reply.text).toContain("1. Report a dispute");
    expect(reply.text).toContain("0. Exit");
  });

  it("does not answer other codes", () => {
    expect(dial("*123#")).toBeNull();
    expect(dial("*245")).toBeNull();
    expect(isShortCode(" *245*1# ")).toBe(true);
  });

  it("follows shortcuts such as *245*3*4#", () => {
    expect(start("*245*3*4#").reply.text).toContain("UGX 10,000,000");
    expect(start("*245*1#").reply.text).toContain("Supplier's name");
  });
});

describe("reporting a dispute", () => {
  it("asks seven questions, confirms, and ends with a reference and an SMS", () => {
    const before = answer(start(), ...REPORT);
    expect(before.reply.text).toContain("Okello Traders");
    expect(before.reply.text).toContain("UGX 2,500,000");

    const done = respond(before.session, "1");
    expect(done.reply.end).toBe(true);
    expect(done.reply.text).toContain("MNY-0042");
    expect(done.reply.sms).toContain("UGX 2,500,000");
    expect(done.reply.created).toMatchObject({ supplier: "Okello Traders", amount: 2_500_000 });
  });

  it("numbers the next report on from the ones already made", () => {
    const first = answer(start(), ...REPORT, "1").reply.created;
    if (!first) throw new Error("no case");
    const second = answer(start("*245#", { cases: [first] }), ...REPORT, "1");
    expect(second.reply.text).toContain("MNY-0043");
  });

  it("can be cancelled", () => {
    const done = answer(start(), ...REPORT, "2");
    expect(done.reply.end).toBe(true);
    expect(done.reply.text).toContain("Nothing was saved");
    expect(done.reply.created).toBeUndefined();
  });

  it("repeats a question after an invalid answer", () => {
    const amount = answer(start(), "1", "Okello", "sugar");
    const bad = respond(amount.session, "a lot");
    expect(bad.reply.text).toMatch(/^Invalid choice\.\n\(3\/7\)/);
    expect(bad.reply.expect).toBe("number");
    expect(respond(bad.session, "9").reply.text).toContain("(4/7)");
  });

  it("rejects a choice that isn't on the list", () => {
    const paid = answer(start(), "1", "Okello", "sugar", "100");
    expect(respond(paid.session, "7").reply.text).toMatch(/^Invalid choice/);
  });
});

describe("navigation", () => {
  it("goes back with 0 and home with 00", () => {
    const goods = answer(start(), "1", "Okello");
    expect(respond(goods.session, "0").reply.text).toContain("(1/7)");
    expect(respond(goods.session, "00").reply.text).toContain("Welcome to MANYA");
  });

  it("exits with 0 on the main menu", () => {
    const bye = respond(start().session, "0");
    expect(bye.reply.end).toBe(true);
    expect(bye.reply.text).toContain("Thank you");
  });
});

describe("other menus", () => {
  it("lists sample cases and opens one", () => {
    const list = answer(start(), "2");
    expect(list.reply.text).toContain(SAMPLE_CASES[0]?.reference);
    expect(respond(list.session, "1").reply.text).toContain("Status: Report ready");
  });

  it("shows a legal option with its source", () => {
    for (const [i] of LEGAL_OPTIONS.entries()) {
      expect(answer(start(), "3", String(i + 1)).reply.text).toContain("Src:");
    }
  });

  it("shows a legal help contact from the provider directory", () => {
    const contact = answer(start(), "4", "1").reply.text;
    expect(contact).toContain("Justice Centres Uganda");
    expect(contact).toContain("0800 100 212");
  });

  it("switches to Luganda and keeps it for the session", () => {
    const home = answer(start(), "5", "2");
    expect(home.reply.lang).toBe("lug");
    expect(home.reply.text).toContain("Emisango gyange");
    expect(respond(home.session, "1").reply.text).toContain("Waaba ensonga");
  });
});

describe("content", () => {
  it("cites only knowledge-base chunks that exist", () => {
    for (const option of LEGAL_OPTIONS) {
      expect(option.chunkIds.length).toBeGreaterThan(0);
      for (const id of option.chunkIds) expect(knownChunk(id)).toBe(true);
    }
  });

  it("has every legal help contact", () => {
    expect(HELP_CONTACTS).toHaveLength(4);
  });

  it("fits every screen on a USSD display, in both languages, even with an error line", () => {
    const paths = [
      ...REPORT.map((_, i) => REPORT.slice(0, i + 1)),
      ["2"],
      ...SAMPLE_CASES.map((_, i) => ["2", String(i + 1)]),
      ["3"],
      ...LEGAL_OPTIONS.map((_, i) => ["3", String(i + 1)]),
      ["4"],
      ...HELP_CONTACTS.map((_, i) => ["4", String(i + 1)]),
      ["5"],
      [],
    ];
    for (const lang of ["en", "lug"] as const) {
      for (const path of paths) {
        const step = answer(start("*245#", { lang }), ...path);
        const withError = respond(step.session, "x");
        const where = `${lang} ${path.join("*")}`;
        expect([where, step.reply.text.length <= SCREEN_LIMIT]).toEqual([where, true]);
        if (!withError.reply.end)
          expect([where, withError.reply.text.length <= SCREEN_LIMIT]).toEqual([where, true]);
      }
    }
  });
});

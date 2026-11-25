import { emptyIntake } from "../fields";
import { heuristicExtract } from "../heuristic";
import { mergeExtraction } from "../merge";
import { addDays, kampalaToday, relativeDateHints, relativeDatesIn } from "../relative-date";

// Wednesday 25 November 2026.
const TODAY = "2026-11-25";
const dates = (text: string) => relativeDatesIn(text, TODAY).map((d) => d.iso);

describe("kampalaToday", () => {
  it("uses Kampala time, not the server's UTC clock", () => {
    // 22:30 UTC on the 24th is already 01:30 on the 25th in Kampala.
    expect(kampalaToday(new Date("2026-11-24T22:30:00Z"))).toBe("2026-11-25");
    expect(kampalaToday(new Date("2026-11-24T20:59:00Z"))).toBe("2026-11-24");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-01", -1)).toBe("2026-11-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("relativeDatesIn", () => {
  it("resolves yesterday, today and tomorrow", () => {
    expect(dates("I paid him yesterday")).toEqual(["2026-11-24"]);
    expect(dates("I paid today")).toEqual(["2026-11-25"]);
    expect(dates("he promised to deliver tomorrow")).toEqual(["2026-11-26"]);
  });

  it("reads 'yesterday but one' as the day before yesterday", () => {
    expect(dates("I paid yesterday but one")).toEqual(["2026-11-23"]);
    expect(dates("I paid the day before yesterday")).toEqual(["2026-11-23"]);
    expect(dates("delivery is tomorrow but one")).toEqual(["2026-11-27"]);
  });

  it("counts days and weeks back", () => {
    expect(dates("3 days ago")).toEqual(["2026-11-22"]);
    expect(dates("two days ago")).toEqual(["2026-11-23"]);
    expect(dates("a week ago")).toEqual(["2026-11-18"]);
    expect(dates("2 weeks ago")).toEqual(["2026-11-11"]);
  });

  it("finds weekdays", () => {
    expect(dates("I paid last Monday")).toEqual(["2026-11-23"]);
    expect(dates("I paid last Wednesday")).toEqual(["2026-11-18"]);
    expect(dates("I paid on Wednesday")).toEqual(["2026-11-25"]);
    expect(dates("he will deliver next Friday")).toEqual(["2026-11-27"]);
  });

  it("leaves vague periods unresolved", () => {
    expect(dates("I paid last week")).toEqual([]);
    expect(dates("some time last month")).toEqual([]);
  });

  it("keeps the order written", () => {
    expect(dates("I paid yesterday but one and he said he'd deliver tomorrow")).toEqual([
      "2026-11-23",
      "2026-11-26",
    ]);
  });
});

describe("relativeDateHints", () => {
  it("lists the dates the model should copy", () => {
    const hints = relativeDateHints(TODAY);
    expect(hints).toContain("2026-11-25, a wednesday");
    expect(hints).toContain("Yesterday: 2026-11-24");
    expect(hints).toContain('"yesterday but one"): 2026-11-23');
  });
});

describe("rules fallback with relative dates", () => {
  it("fills the payment date from 'yesterday'", () => {
    const { extraction } = heuristicExtract("I paid him yesterday", ["transaction.date"], TODAY);
    expect(extraction["transaction.date"]).toBe("2026-11-24");
  });

  it("keeps the resolved date through grounding", () => {
    const text = "I paid him 2 million shillings yesterday but one";
    const { extraction } = heuristicExtract(text, ["transaction.date"], TODAY);
    const { intake } = mergeExtraction(emptyIntake(), extraction, text);
    expect(intake.values["transaction.date"]?.value).toBe("2026-11-23");
  });

  it("dates timeline events said relatively", () => {
    const { events } = heuristicExtract(
      "I paid on Monday. Yesterday he stopped picking my calls.",
      [],
      TODAY,
    );
    expect(events.map((e) => e.date)).toEqual(["2026-11-23", "2026-11-24"]);
  });
});

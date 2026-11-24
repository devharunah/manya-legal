import { type Intake, emptyIntake } from "../fields";
import {
  amountGrounded,
  amountsIn,
  currencyGrounded,
  dateGrounded,
  phoneGrounded,
} from "../ground";
import { datesIn, heuristicExtract } from "../heuristic";
import { confirmAll, editField, markUnknown, mergeExtraction } from "../merge";
import { completion, missingRequired, nextField } from "../progress";

const STORY =
  "I paid the supplier 2 million shillings on 10 November 2026 for merchandise, but the goods have not been delivered.";

describe("grounding", () => {
  it("reads amounts however they are written", () => {
    expect(amountsIn("UGX 2,000,000")).toContain(2_000_000);
    expect(amountsIn("2 million shillings")).toContain(2_000_000);
    expect(amountsIn("1.5m")).toContain(1_500_000);
    expect(amountsIn("two million")).toContain(2_000_000);
    expect(amountsIn("500k")).toContain(500_000);
  });

  it("rejects an amount the trader never said", () => {
    expect(amountGrounded(2_000_000, STORY)).toBe(true);
    expect(amountGrounded(3_000_000, STORY)).toBe(false);
  });

  it("needs some date in the text and a valid ISO date", () => {
    expect(dateGrounded("2026-11-10", STORY)).toBe(true);
    expect(dateGrounded("2026-11-10", "I paid him")).toBe(false);
    expect(dateGrounded("10/11/2026", STORY)).toBe(false);
  });

  it("matches phone numbers by digits", () => {
    expect(phoneGrounded("0772123456", "call me on 0772 123 456")).toBe(true);
    expect(phoneGrounded("0772123456", "call me")).toBe(false);
  });

  it("accepts UGX only when shillings are mentioned", () => {
    expect(currencyGrounded("UGX", STORY)).toBe(true);
    expect(currencyGrounded("UGX", "I paid 2 million")).toBe(false);
    expect(currencyGrounded("USD", "I paid 200 USD")).toBe(true);
  });
});

describe("mergeExtraction", () => {
  it("keeps grounded values and drops invented ones", () => {
    const { intake, dropped, accepted } = mergeExtraction(
      emptyIntake(),
      {
        "transaction.amount": 2_000_000,
        "transaction.date": "2026-11-10",
        "respondent.phone": "0700111222",
      },
      STORY,
    );
    expect(accepted).toEqual(expect.arrayContaining(["transaction.amount", "transaction.date"]));
    expect(dropped).toEqual(["respondent.phone"]);
    expect(intake.values["respondent.phone"]).toBeUndefined();
    expect(intake.values["transaction.amount"]).toEqual({
      value: 2_000_000,
      source: "complainant",
      confirmed: false,
    });
  });

  it("never fills a field the extraction left null", () => {
    const { intake } = mergeExtraction(emptyIntake(), { "respondent.name": null }, STORY);
    expect(intake.values).toEqual({});
  });

  it("never overwrites a value the trader confirmed", () => {
    const confirmed = editField(emptyIntake(), "transaction.amount", "2,000,000");
    const { intake } = mergeExtraction(
      confirmed,
      { "transaction.amount": 1_500_000 },
      "it was 1,500,000",
    );
    expect(intake.values["transaction.amount"]?.value).toBe(2_000_000);
  });

  it("rejects a choice outside the allowed list", () => {
    const { dropped } = mergeExtraction(emptyIntake(), { requested_resolution: "revenge" }, "x");
    expect(dropped).toEqual(["requested_resolution"]);
  });
});

describe("edits and unknowns", () => {
  it("records an unknown field and stops asking for it", () => {
    let intake: Intake = emptyIntake();
    intake = markUnknown(intake, "complainant.name");
    expect(nextField(intake)).toBe("complainant.phone");
    expect(missingRequired(intake)).not.toContain("complainant.name");
  });

  it("clears a field when the trader empties it", () => {
    const filled = editField(emptyIntake(), "transaction.goods", "Sugar");
    expect(editField(filled, "transaction.goods", "").values["transaction.goods"]).toBeUndefined();
  });

  it("ignores an invalid amount or choice", () => {
    expect(editField(emptyIntake(), "transaction.amount", "lots").values).toEqual({});
    expect(editField(emptyIntake(), "delivery.status", "lost").values).toEqual({});
  });

  it("confirms every value", () => {
    const intake = confirmAll(
      mergeExtraction(emptyIntake(), { "transaction.amount": 2_000_000 }, STORY).intake,
    );
    expect(intake.values["transaction.amount"]?.confirmed).toBe(true);
  });
});

describe("progress", () => {
  it("asks required fields first, in PRD order", () => {
    expect(nextField(emptyIntake())).toBe("complainant.name");
    expect(completion(emptyIntake())).toBe(0);
  });
});

describe("heuristicExtract", () => {
  it("reads the demo story", () => {
    const { extraction, category } = heuristicExtract(STORY, null);
    expect(category).toBe("supplier_non_delivery");
    expect(extraction).toMatchObject({
      "transaction.amount": 2_000_000,
      "transaction.currency": "UGX",
      "transaction.date": "2026-11-10",
      "delivery.status": "not_delivered",
    });
  });

  it("takes a free-text answer for the field being asked", () => {
    expect(heuristicExtract("Kato Traders", "respondent.name").extraction["respondent.name"]).toBe(
      "Kato Traders",
    );
  });

  it("parses written dates", () => {
    expect(datesIn("on 3rd Nov 2026 and 2026-12-01")).toEqual(["2026-11-03", "2026-12-01"]);
  });
});

import { emptyIntake } from "../fields";
import { editField, markUnknown } from "../merge";
import { summaryFacts, templateSummary } from "../summary";

let intake = emptyIntake();
intake = editField(intake, "respondent.name", "Kato Wholesalers");
intake = editField(intake, "transaction.amount", "2000000");
intake = editField(intake, "transaction.currency", "UGX");
intake = markUnknown(intake, "respondent.phone");

describe("AI summary input", () => {
  it("gives the model only the reported facts, and says what is missing", () => {
    const facts = summaryFacts(intake);
    expect(facts).toContain("Supplier (respondent): Kato Wholesalers");
    expect(facts).toContain("Amount paid: 2,000,000");
    expect(facts).toContain("Supplier phone: not known to the trader");
    expect(facts).toContain("Date of payment: not provided");
  });

  it("builds a no-AI summary that never fills gaps", () => {
    const text = templateSummary(intake);
    expect(text).toBe(
      "You reported that you paid Kato Wholesalers UGX 2,000,000. Still missing: complainant name, contact phone, date of payment, goods purchased, type of agreement, delivery status, outcome you want.",
    );
  });
});

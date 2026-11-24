import { keepsNumbers, numbersIn } from "../numbers";

describe("numbersIn", () => {
  it("keeps section numbers whole and drops small counts", () => {
    expect(numbersIn("Section 8(1) and 2 photos, 12 months, UGX 150,000.")).toEqual([
      "8(1)",
      "12",
      "150000",
    ]);
  });
});

describe("keepsNumbers", () => {
  it("passes when a translator writes a small count as a word", () => {
    expect(keepsNumbers("2 passport photos", "ebifaananyi ebibiri")).toBe(true);
  });

  it("fails when a period or amount goes missing", () => {
    expect(keepsNumbers("valid for 12 months", "ekola emyezi kkumi n'ebiri")).toBe(false);
    expect(keepsNumbers("UGX 150,000", "UGX 15,000")).toBe(false);
  });

  it("matches amounts written with or without thousands separators", () => {
    expect(keepsNumbers("UGX 150,000", "UGX 150000")).toBe(true);
  });

  it("fails when the translation adds an amount the English didn't have", () => {
    expect(keepsNumbers("Pay the fee for your area.", "Sasula UGX 200,000.")).toBe(false);
  });

  it("fails when a time limit is swapped, even a single digit", () => {
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku 30.")).toBe(false);
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku musanvu.")).toBe(false);
    expect(keepsNumbers("Renew within 7 days.", "Zza obuggya mu nnaku 7.")).toBe(true);
  });

  it("checks a sub-section like 8(1) whole, not its first digit alone", () => {
    expect(numbersIn("Section 8(1) applies")).toEqual(["8(1)"]);
  });

  it("treats a single-digit section number as significant", () => {
    expect(numbersIn("Under section 5 you must")).toEqual(["5"]);
    expect(keepsNumbers("Under section 5 you must", "Mu kitundu kino olina")).toBe(false);
  });
});


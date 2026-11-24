/** Number checks shared by every translation and extraction step. */

const NUMBER = /\d[\d,.]*(?:\(\d+\))*/g;
const normalise = (n: string) => n.replace(/[.,]+$/, "").replace(/,/g, "");

/** Every number written in digits, normalised ("150,000" → "150000", "8(1)" kept whole). */
export function allNumbers(text: string): string[] {
  return (text.match(NUMBER) ?? []).map(normalise);
}

/**
 * Numbers that must survive translation in digits: amounts, years, section
 * numbers like 8(1), periods like 12 months. A single digit 1-9 may be written
 * as a word ("2 photos" → "ebifaananyi ebibiri"), unless it is a section
 * number or a time limit, where a lost digit changes the law.
 */
export function numbersIn(text: string): string[] {
  const legal = [
    // "section 5" but not the "8" of "section 8(1)", which is matched whole above.
    ...text.matchAll(
      /\b(?:sections?|s\.|regulations?|rules?|schedules?|articles?)\s*(\d)\b(?!\()/gi,
    ),
    ...text.matchAll(/\b(\d)\s*(?:days?|weeks?|months?|years?|hours?)\b/gi),
  ].map((m) => m[1] as string);
  return [...allNumbers(text).filter((n) => !/^[1-9]$/.test(n)), ...legal];
}

/**
 * True when the translation keeps every significant number and adds or swaps
 * none: "within 7 days" must not become "within 30 days", and an amount must
 * never appear that the English didn't have.
 */
export function keepsNumbers(english: string, translated: string): boolean {
  const inTranslation = new Set(allNumbers(translated));
  const inEnglish = new Set(allNumbers(english));
  return (
    numbersIn(english).every((n) => inTranslation.has(n)) &&
    [...inTranslation].every((n) => inEnglish.has(n))
  );
}

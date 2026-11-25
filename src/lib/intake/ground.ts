/**
 * Checks that a value the model extracted was actually said by the trader.
 * The model may misread or fill gaps; anything it can't point back to in the
 * trader's own words is dropped and asked for again (PRD 4.4: never invent).
 */

const WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,
  half: 0.5,
};

const SCALE: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  million: 1_000_000,
  millions: 1_000_000,
  bn: 1_000_000_000,
  billion: 1_000_000_000,
};

/** Every amount the text states: "2,000,000", "2 million", "1.5m", "two million", "500k". */
export function amountsIn(text: string): number[] {
  const out: number[] = [];
  const lower = text.toLowerCase();
  const pattern =
    /(\d[\d,]*(?:\.\d+)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|half)\b)\s*(k|m|bn|thousand|millions?|billion)?\b/g;
  for (const match of lower.matchAll(pattern)) {
    const raw = match[1] ?? "";
    const base = /\d/.test(raw) ? Number(raw.replace(/,/g, "")) : (WORDS[raw] ?? Number.NaN);
    if (!Number.isFinite(base)) continue;
    const scale = match[2] ? (SCALE[match[2]] ?? 1) : 1;
    out.push(Math.round(base * scale));
  }
  return out;
}

export const amountGrounded = (amount: number, text: string) => amountsIn(text).includes(amount);

const MONTHS =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(yesterday|today|tomorrow|tonight|last|next|ago|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\d/i;

/** A date is kept only if it is a real ISO date and the trader mentioned some date. */
export function dateGrounded(iso: string, text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(iso))) return false;
  return MONTHS.test(text);
}

const digits = (s: string) => s.replace(/\D/g, "");

/** A phone number is kept only when the same digits appear in the text. */
export function phoneGrounded(phone: string, text: string): boolean {
  const want = digits(phone);
  return want.length >= 9 && digits(text).includes(want.slice(-9));
}

/** "UGX" needs shillings mentioned; other codes must appear as written. */
export function currencyGrounded(code: string, text: string): boolean {
  if (code === "UGX") return /\b(ugx|ushs?|shs?|shillings?|\/=)|\d\s*\/=/i.test(text);
  return /^[A-Z]{3}$/.test(code) && new RegExp(`\\b${code}\\b`, "i").test(text);
}

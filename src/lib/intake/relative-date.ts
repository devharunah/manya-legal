/**
 * Turns the way traders actually talk about days ("yesterday", "yesterday but
 * one", "three days ago", "last Monday") into calendar dates. Only phrases that
 * name one exact day are resolved; "last week" or "some time ago" stay
 * unresolved so MANYA asks again instead of guessing.
 */

/** Uganda is UTC+3 all year (no daylight saving). */
const KAMPALA_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Today's date in Kampala as yyyy-mm-dd. Server clocks run in UTC, which is wrong before 03:00 EAT. */
export function kampalaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + KAMPALA_OFFSET_MS).toISOString().slice(0, 10);
}

/** `iso` moved by `days` (negative goes back). */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const COUNTS: Record<string, number> = {
  a: 1,
  an: 1,
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
};

const dayOfWeek = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** The most recent `weekday` strictly before today (or on/before, when `inclusive`). */
function pastWeekday(today: string, weekday: number, inclusive: boolean): string {
  const back = (dayOfWeek(today) - weekday + 7) % 7;
  return addDays(today, back === 0 && !inclusive ? -7 : -back);
}

/** The next `weekday` strictly after today. */
function nextWeekday(today: string, weekday: number): string {
  const ahead = (weekday - dayOfWeek(today) + 7) % 7;
  return addDays(today, ahead === 0 ? 7 : ahead);
}

const COUNT = "(\\d{1,2}|a|an|one|two|three|four|five|six|seven|eight|nine|ten)";
const DAY = `(${WEEKDAYS.join("|")})`;

/** Longest phrases first, so "yesterday but one" is not read as plain "yesterday". */
const RULES: { re: RegExp; resolve: (m: RegExpMatchArray, today: string) => string | null }[] = [
  {
    re: /\b(?:the\s+)?day\s+before\s+yesterday\b|\byesterday\s+but\s+one\b/gi,
    resolve: (_m, t) => addDays(t, -2),
  },
  {
    re: /\b(?:the\s+)?day\s+after\s+tomorrow\b|\btomorrow\s+but\s+one\b/gi,
    resolve: (_m, t) => addDays(t, 2),
  },
  { re: /\byesterday\b/gi, resolve: (_m, t) => addDays(t, -1) },
  { re: /\btomorrow\b/gi, resolve: (_m, t) => addDays(t, 1) },
  {
    re: /\b(?:today|this\s+(?:morning|afternoon|evening)|tonight)\b/gi,
    resolve: (_m, t) => t,
  },
  {
    re: new RegExp(`\\b${COUNT}\\s+(days?|weeks?)\\s+ago\\b`, "gi"),
    resolve: (m, t) => {
      const raw = (m[1] ?? "").toLowerCase();
      const n = /\d/.test(raw) ? Number(raw) : (COUNTS[raw] ?? Number.NaN);
      if (!Number.isFinite(n) || n <= 0) return null;
      return addDays(t, -n * (/week/i.test(m[2] ?? "") ? 7 : 1));
    },
  },
  {
    re: new RegExp(`\\b(last|next|on|this\\s+coming|this\\s+past)\\s+${DAY}\\b`, "gi"),
    resolve: (m, t) => {
      const when = (m[1] ?? "").toLowerCase().replace(/\s+/g, " ");
      const weekday = WEEKDAYS.indexOf((m[2] ?? "").toLowerCase());
      if (weekday < 0) return null;
      if (when === "next" || when === "this coming") return nextWeekday(t, weekday);
      // "on Monday" said on a Monday means today; "last Monday" never does.
      return pastWeekday(t, weekday, when === "on");
    },
  },
];

/** Every exact day the text names relative to `today`, with where it was written. */
export function relativeDatesIn(text: string, today: string): { at: number; iso: string }[] {
  const taken: [number, number][] = [];
  const found: { at: number; iso: string }[] = [];
  for (const { re, resolve } of RULES) {
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      const iso = resolve(m, today);
      if (!iso) continue;
      taken.push([start, end]);
      found.push({ at: start, iso });
    }
  }
  return found.sort((a, b) => a.at - b.at);
}

/** A short lookup the model can copy from, so it never does calendar maths itself. */
export function relativeDateHints(today: string): string {
  const weekday = WEEKDAYS[dayOfWeek(today)] ?? "";
  return [
    `Today (Kampala): ${today}, a ${weekday}`,
    `Yesterday: ${addDays(today, -1)}`,
    `Day before yesterday (also said "yesterday but one"): ${addDays(today, -2)}`,
    `Tomorrow: ${addDays(today, 1)}`,
  ].join("\n");
}

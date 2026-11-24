import type { AnswerText } from "@/lib/answer/types";

export type Translate = (text: string) => Promise<string>;

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

async function mapPooled<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

type Outcome = { text: string; ok: true } | { text: string; ok: false; failed: boolean };

export interface TranslatedAnswer {
  text: AnswerText;
  /** Lines shown in English because translation failed or dropped a number. */
  keptInEnglish: number;
}

/**
 * Translates every line of an answer. A line whose numbers don't survive, or
 * whose call fails, stays in English: a missing amount or section number is a
 * change of legal meaning we can detect, so we don't show it.
 * Throws when no line could be translated at all (the service is down).
 */
export async function translateAnswerText(
  source: AnswerText,
  translate: Translate,
  { concurrency = 6 }: { concurrency?: number } = {},
): Promise<TranslatedAnswer> {
  const flat = [
    source.directAnswer,
    ...source.lawSays,
    source.meansForYou,
    ...source.nextSteps,
    ...source.clarifyingQuestions,
    source.uncertainty,
    ...source.warnings,
  ];
  const unique = [...new Set(flat.filter((s) => s.trim().length > 0))];

  const outcomes = await mapPooled(unique, concurrency, async (english): Promise<Outcome> => {
    try {
      const translated = (await translate(english)).trim();
      return translated && keepsNumbers(english, translated)
        ? { text: translated, ok: true }
        : { text: english, ok: false, failed: false };
    } catch {
      return { text: english, ok: false, failed: true };
    }
  });

  if (unique.length > 0 && outcomes.every((o) => !o.ok && o.failed)) {
    throw new Error("Translation service unavailable");
  }

  const byEnglish = new Map(unique.map((u, i) => [u, outcomes[i] as Outcome]));
  const tr = (s: string) => byEnglish.get(s)?.text ?? s;

  return {
    text: {
      directAnswer: tr(source.directAnswer),
      lawSays: source.lawSays.map(tr),
      meansForYou: tr(source.meansForYou),
      nextSteps: source.nextSteps.map(tr),
      clarifyingQuestions: source.clarifyingQuestions.map(tr),
      uncertainty: tr(source.uncertainty),
      warnings: source.warnings.map(tr),
    },
    keptInEnglish: flat.filter((s) => byEnglish.get(s)?.ok === false).length,
  };
}

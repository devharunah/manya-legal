import type { AnswerText } from "@/lib/answer/types";

/**
 * Text-to-speech takes about as long per clip regardless of what's in it, and
 * short clips come back far sooner than long ones. So we speak in short pieces,
 * fetched in parallel and played in order.
 */
// Measured on Sunbird: ~5 s for a short sentence warm, much longer for long
// text or a cold worker. Short pieces start the audio sooner.
export const MAX_PIECE = 160;

function splitLong(sentence: string, max: number): string[] {
  if (sentence.length <= max) return [sentence];
  const out: string[] = [];
  let current = "";
  for (const word of sentence.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > max && current) {
      out.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) out.push(current);
  return out;
}

/** Splits text into sentence-aligned pieces of at most `max` characters. */
export function speechPieces(text: string, max = MAX_PIECE): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .flatMap((s) => splitLong(s, max));

  const pieces: string[] = [];
  for (const sentence of sentences) {
    const last = pieces.at(-1);
    if (last !== undefined && last.length + 1 + sentence.length <= max) {
      pieces[pieces.length - 1] = `${last} ${sentence}`;
    } else {
      pieces.push(sentence);
    }
  }
  return pieces;
}

/** Ends a list item with a full stop so it is read as its own sentence. */
function asSentence(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

const toPieces = (lines: string[]) =>
  speechPieces(
    lines
      .filter((s) => s.trim())
      .map(asSentence)
      .join(" "),
  );

/**
 * What the Luganda voice reads. Built from the English and Luganda versions
 * together so that:
 * - a law point with no source is never read out, since audio can't carry the
 *   on-screen "No source found" warning;
 * - a line left in English (its translation was rejected) is skipped, not
 *   mangled by a Luganda voice;
 * - the caveats (uncertainty and warnings) are read, not just the good news.
 * Citations stay on screen.
 */
export function spokenAnswer(
  english: AnswerText,
  luganda: AnswerText,
  supported: readonly boolean[],
): { all: string[]; steps: string[] } {
  const translated = (en: string, lg: string | undefined) =>
    lg !== undefined && lg.trim() !== "" && lg !== en;
  const all = () => true;
  const pick = (en: readonly string[], lg: readonly string[], keep: (i: number) => boolean = all) =>
    lg.filter((l, i) => keep(i) && translated(en[i] ?? "", l));
  const one = (en: string, lg: string) => (translated(en, lg) ? [lg] : []);

  const steps = pick(english.nextSteps, luganda.nextSteps);
  return {
    all: toPieces([
      ...one(english.directAnswer, luganda.directAnswer),
      ...pick(english.lawSays, luganda.lawSays, (i) => supported[i] === true),
      ...one(english.meansForYou, luganda.meansForYou),
      ...steps,
      ...one(english.uncertainty, luganda.uncertainty),
      ...pick(english.warnings, luganda.warnings),
    ]),
    steps: toPieces(steps),
  };
}

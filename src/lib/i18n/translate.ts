import { type MessageKey, type Messages, en } from "./en";
import { lug } from "./lug";

export type Vars = { n?: number | string };
export type Translator = (key: MessageKey, vars?: Vars) => string;

const DICTIONARIES: Record<"en" | "lug", Partial<Messages>> = { en, lug };

/** Fills `{n}`; anything else is returned as written. */
export function format(text: string, vars?: Vars): string {
  return vars?.n === undefined ? text : text.replaceAll("{n}", String(vars.n));
}

/** Looks a key up in the given dictionary, falling back to English. */
export function translate(lang: "en" | "lug", key: MessageKey, vars?: Vars): string {
  return format(DICTIONARIES[lang][key] || en[key], vars);
}

/** Label for a dynamic key such as `choice.<field>.<value>`; unknown keys show the fallback. */
export function lookup(t: Translator, key: string, fallback: string): string {
  return key in en ? t(key as MessageKey) : fallback;
}

/** English labels for server-side output such as PDFs. */
export const enT: Translator = (key, vars) => translate("en", key, vars);

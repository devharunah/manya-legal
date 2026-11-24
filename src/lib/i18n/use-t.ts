"use client";

import { useCallback } from "react";

import { useLanguage } from "@/lib/use-language";

import { type MessageKey, en } from "./en";
import { lug } from "./lug";

export type Translator = (key: MessageKey, vars?: { n?: number | string }) => string;

const DICTIONARIES = { en, lug } as const;

/** Fills `{n}`; anything else is returned as written. */
export function format(text: string, vars?: { n?: number | string }): string {
  return vars?.n === undefined ? text : text.replaceAll("{n}", String(vars.n));
}

/** Looks a key up in the given dictionary, falling back to English. */
export function translate(
  lang: "en" | "lug",
  key: MessageKey,
  vars?: { n?: number | string },
): string {
  return format(DICTIONARIES[lang][key] || en[key], vars);
}

/** Interface strings in the trader's chosen language (English on the server). */
export function useT(): Translator {
  const [lang] = useLanguage();
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}

/** Interface label for a profile value or referral; unknown values are shown as they are. */
export function lookup(t: Translator, prefix: "profile" | "referral", value: string): string {
  const key = `${prefix}.${value}`;
  return key in en ? t(key as MessageKey) : value;
}

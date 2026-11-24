"use client";

import { useCallback } from "react";

import { useLanguage } from "@/lib/use-language";

import { type Translator, translate } from "./translate";

export { format, lookup, translate, type Translator } from "./translate";

/** Interface strings in the trader's chosen language (English on the server). */
export function useT(): Translator {
  const [lang] = useLanguage();
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}

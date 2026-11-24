"use client";

import { useEffect } from "react";

import { useLanguage } from "@/lib/use-language";

/** Keeps <html lang> in step with the chosen language, for screen readers and spell-check. */
export function HtmlLang() {
  const [lang] = useLanguage();
  useEffect(() => {
    document.documentElement.lang = lang === "lug" ? "lg" : "en";
  }, [lang]);
  return null;
}

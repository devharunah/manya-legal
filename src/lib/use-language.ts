"use client";

import { useSyncExternalStore } from "react";

export type AnswerLanguage = "en" | "lug";

const KEY = "manya.language.v1";
const listeners = new Set<() => void>();
let cache: AnswerLanguage | undefined;

function read(): AnswerLanguage {
  try {
    return window.localStorage.getItem(KEY) === "lug" ? "lug" : "en";
  } catch {
    return "en";
  }
}

function setLanguage(next: AnswerLanguage) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // Blocked storage: the choice still holds for this visit.
  }
  for (const l of listeners) l();
}

/** The trader's answer language, kept in this browser only. */
export function useLanguage(): [AnswerLanguage, (next: AnswerLanguage) => void] {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      if (cache === undefined) cache = read();
      return cache;
    },
    () => "en" as const,
  );
  return [value, setLanguage];
}

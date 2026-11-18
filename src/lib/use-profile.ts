"use client";

import { useSyncExternalStore } from "react";

import { type Profile, profileSchema } from "./profile";

const KEY = "manya.profile.v1";
const listeners = new Set<() => void>();
// undefined: not read yet. null: read, nothing saved.
let cache: Profile | null | undefined;

function read(): Profile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Profile | null {
  if (cache === undefined) cache = read();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(next: Profile | null) {
  cache = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the profile still works for this visit.
  }
  for (const l of listeners) l();
}

export const saveProfile = (next: Profile) => set(next);
export const clearProfile = () => set(null);

/** The business profile lives only in this browser (brief 6.7). */
export function useProfile() {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => undefined);
  return {
    profile: value ?? null,
    loaded: value !== undefined,
    save: saveProfile,
    clear: clearProfile,
  };
}

/** True when the page was opened with ?demo, read without a Suspense boundary. */
export function useIsDemo(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has("demo"),
    () => false,
  );
}

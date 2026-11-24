import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { CaseStore } from "@/lib/cases/types";
import { optionalEnv, requireEnv } from "@/lib/env";

import { createMemoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";

/**
 * Which store serves this request:
 * - supabase: SUPABASE_URL and SUPABASE_ANON_KEY are set (production).
 * - memory: E2E_MOCK_DB is set, or local dev without Supabase. Never in production.
 * - none: production without Supabase; the API answers 503.
 */
export function storeMode(): "supabase" | "memory" | "none" {
  const production = optionalEnv("VERCEL_ENV", "") === "production";
  if (optionalEnv("E2E_MOCK_DB", "") !== "" && !production) return "memory";
  if (optionalEnv("SUPABASE_URL", "") && optionalEnv("SUPABASE_ANON_KEY", "")) return "supabase";
  return production ? "none" : "memory";
}

const MEMORY_COOKIE = "manya_dev_uid";

async function supabaseClient() {
  const jar = await cookies();
  return createServerClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) jar.set(name, value, options);
      },
    },
  });
}

export class NoStoreError extends Error {
  constructor() {
    super("Case storage is not configured.");
    this.name = "NoStoreError";
  }
}

/** The signed-in trader's store, or null when there is no session yet. */
export async function getStore(): Promise<CaseStore | null> {
  const mode = storeMode();
  if (mode === "none") throw new NoStoreError();
  if (mode === "memory") {
    const uid = (await cookies()).get(MEMORY_COOKIE)?.value;
    return uid ? createMemoryStore(uid) : null;
  }
  const sb = await supabaseClient();
  const { data } = await sb.auth.getUser();
  return data.user ? createSupabaseStore(sb, data.user.id) : null;
}

/**
 * Returns the trader's store, starting an anonymous session on first visit.
 * PRD 2.1 asks for no assumptions about technical skill: no password to
 * create, and the profile holds the details a mediator needs.
 */
export async function startSession(): Promise<CaseStore> {
  const existing = await getStore();
  if (existing) return existing;
  if (storeMode() === "memory") {
    const uid = crypto.randomUUID();
    (await cookies()).set(MEMORY_COOKIE, uid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return createMemoryStore(uid);
  }
  const sb = await supabaseClient();
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`anonymous sign-in: ${error?.message ?? "no user"}`);
  return createSupabaseStore(sb, data.user.id);
}

/** Ends the session on this device. The trader's data stays in the database. */
export async function endSession(): Promise<void> {
  if (storeMode() === "memory") {
    (await cookies()).delete(MEMORY_COOKIE);
    return;
  }
  const sb = await supabaseClient();
  await sb.auth.signOut();
}

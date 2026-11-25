"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useState } from "react";

import type { Profile } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

import { api } from "./client-api";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: Profile | null };

interface Session {
  state: SessionState;
  setProfile: (p: Profile) => void;
  reload: () => void;
}

const SessionContext = createContext<Session | null>(null);

/** Starts or resumes the trader's session once per page load. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the request on retry.
  useEffect(() => {
    let live = true;
    api<{ profile: Profile | null }>("/api/session", { method: "POST" })
      .then(({ profile }) => live && setState({ status: "ready", profile }))
      .catch(
        (e: unknown) =>
          live && setState({ status: "error", message: String((e as Error).message) }),
      );
    return () => {
      live = false;
    };
  }, [attempt]);

  const setProfile = useCallback((profile: Profile) => setState({ status: "ready", profile }), []);
  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return <SessionContext value={{ state, setProfile, reload }}>{children}</SessionContext>;
}

export function useSession(): Session {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession outside SessionProvider");
  return session;
}

/**
 * Renders children only for a registered trader; sends everyone else to
 * registration. Shows a loading or error state while the session starts.
 */
export function RequireProfile({ children }: { children: (profile: Profile) => React.ReactNode }) {
  const { state, reload } = useSession();
  const router = useRouter();
  const t = useT();
  const needsRegistration = state.status === "ready" && !state.profile;

  useEffect(() => {
    if (needsRegistration) router.replace("/register");
  }, [needsRegistration, router]);

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-danger">{state.message}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-4 rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }
  if (state.status === "loading" || !state.profile) {
    return (
      <output className="grid place-items-center py-24 text-ink-3">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">{t("common.loading")}</span>
      </output>
    );
  }
  return <>{children(state.profile)}</>;
}

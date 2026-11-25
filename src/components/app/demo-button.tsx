"use client";

import { Loader2, MessageSquarePlus, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Profile } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

import { api } from "./client-api";
import { useSession } from "./session";

/**
 * Loads the stage demo (a fictional trader with two complete cases and SAMPLE
 * documents) into this browser's session, then opens the flagship case.
 */
export function DemoButton({
  label,
  className,
}: { label: "demo.open" | "demo.load"; className: string }) {
  const t = useT();
  const router = useRouter();
  const { setProfile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    setBusy(true);
    setError(false);
    try {
      const r = await api<{ flagship: string | null; profile: Profile }>("/api/demo", {
        method: "POST",
      });
      setProfile(r.profile);
      router.push(r.flagship ? `/cases/${r.flagship}` : "/dashboard");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void load()} disabled={busy} className={className}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <PlayCircle className="size-4" aria-hidden />
        )}
        {busy ? t("demo.loading") : t(label)}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {t("demo.error")}
        </p>
      )}
    </div>
  );
}

/**
 * Starts a fresh live-demo case: the presenter taps a prepared answer for each
 * question and sends it, so the chat can be shown live without stalling.
 */
export function LiveDemoButton({ className }: { className: string }) {
  const t = useT();
  const router = useRouter();
  const { setProfile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function start() {
    setBusy(true);
    setError(false);
    try {
      const r = await api<{ id: string; profile: Profile }>("/api/demo/live", { method: "POST" });
      setProfile(r.profile);
      router.push(`/cases/${r.id}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void start()} disabled={busy} className={className}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MessageSquarePlus className="size-4" aria-hidden />
        )}
        {busy ? t("demo.loading") : t("demo.live")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {t("demo.liveError")}
        </p>
      )}
    </div>
  );
}

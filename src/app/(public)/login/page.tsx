"use client";

import { Info, Loader2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";

import { api } from "@/components/app/client-api";
import { useSession } from "@/components/app/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

type Mode = "signIn" | "signUp";

const emailSchema = z.email();

const tabClass =
  "text-ink-3 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-brand-900 data-[state=active]:shadow-sm";

/**
 * Demo sign-in and sign-up. There are no real accounts: any well-formed email
 * gets in, and the email and password never leave this component. Signing in
 * continues to the business-profile step (or the dashboard when this browser
 * already has a profile). The hackathon button signs in as the fictional
 * demo trader and opens the dashboard, where the live demo starts.
 */
export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { state, setProfile } = useSession();
  const registered = state.status === "ready" && state.profile !== null;

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState(false);

  useEffect(() => {
    if (registered) router.replace("/dashboard");
  }, [registered, router]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const badEmail = !emailSchema.safeParse(email.trim()).success;
    const badPassword = password.length === 0;
    setEmailError(badEmail);
    setPasswordError(badPassword);
    if (badEmail || badPassword) return;
    router.push("/register");
  }

  async function openDemo() {
    setDemoBusy(true);
    setDemoError(false);
    try {
      const r = await api<{ profile: Profile }>("/api/demo/profile", { method: "POST" });
      setProfile(r.profile);
      router.push("/dashboard");
    } catch {
      setDemoError(true);
      setDemoBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("auth.title")}</h1>
      <p className="mt-2 text-ink-3">{t("auth.body")}</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="h-11! w-full bg-canvas">
            {(["signIn", "signUp"] as const).map((value) => (
              <TabsTrigger key={value} value={value} className={tabClass}>
                {t(value === "signIn" ? "auth.signIn" : "auth.signUp")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form noValidate onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("auth.email")}</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailError}
              aria-describedby={emailError ? "auth-email-error" : undefined}
            />
            {emailError && (
              <p id="auth-email-error" role="alert" className="text-sm text-danger">
                {t("auth.emailError")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">{t("auth.password")}</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={passwordError}
              aria-describedby={passwordError ? "auth-password-error" : undefined}
            />
            {passwordError && (
              <p id="auth-password-error" role="alert" className="text-sm text-danger">
                {t("auth.passwordError")}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            {mode === "signIn" ? t("auth.submitSignIn") : t("auth.submitSignUp")}
          </Button>
          <p className="flex gap-2 rounded-lg bg-canvas p-3 text-xs leading-5 text-ink-3">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("auth.demoNote")}
          </p>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-ink-3 uppercase">
          <span className="h-px flex-1 bg-line" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void openDemo()}
          disabled={demoBusy}
        >
          {demoBusy ? <Loader2 className="animate-spin" aria-hidden /> : <PlayCircle aria-hidden />}
          {demoBusy ? t("auth.hackathonLoading") : t("auth.hackathon")}
        </Button>
        <p className="mt-2 text-center text-xs text-ink-3">{t("auth.hackathonBody")}</p>
        {demoError && (
          <p role="alert" className="mt-2 text-center text-sm text-danger">
            {t("auth.hackathonError")}
          </p>
        )}
      </div>
    </main>
  );
}

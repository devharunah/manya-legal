"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ProfileForm } from "@/components/app/profile-form";
import { useSession } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const { state } = useSession();
  const registered = state.status === "ready" && state.profile !== null;

  useEffect(() => {
    if (registered) router.replace("/dashboard");
  }, [registered, router]);

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("register.title")}</h1>
      <p className="mt-2 text-muted">{t("register.body")}</p>
      <div className="mt-8">
        {state.status === "ready" && !registered ? (
          <ProfileForm
            initial={null}
            submitLabel={t("register.save")}
            onSaved={() => router.push("/dashboard")}
          />
        ) : state.status === "error" ? (
          <p className="text-sm text-red-700">{state.message}</p>
        ) : (
          <Loader2
            className="mx-auto size-6 animate-spin text-muted"
            aria-label={t("common.loading")}
          />
        )}
      </div>
    </main>
  );
}

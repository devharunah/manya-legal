"use client";

import { useState } from "react";

import { ProfileForm } from "@/components/app/profile-form";
import { RequireProfile } from "@/components/app/session";
import { useT } from "@/lib/i18n/use-t";

export default function ProfilePage() {
  const t = useT();
  const [saved, setSaved] = useState(false);
  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("profile.title")}</h1>
      <div className="mt-8">
        <RequireProfile>
          {(profile) => (
            <ProfileForm
              initial={profile}
              submitLabel={t("review.save")}
              onSaved={() => setSaved(true)}
            />
          )}
        </RequireProfile>
        {saved && (
          <output className="mt-4 block text-sm font-medium text-success">
            {t("profile.saved")}
          </output>
        )}
      </div>
    </div>
  );
}

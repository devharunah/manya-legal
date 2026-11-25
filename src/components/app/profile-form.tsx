"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { BUSINESS_TYPES } from "@/lib/cases/profile";
import type { Profile } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";
import { useLanguage } from "@/lib/use-language";

import { api } from "./client-api";
import { useSession } from "./session";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const label = "block text-sm font-semibold text-ink";

/** Registration and profile editing (PRD 9.1, 9.2). Only what a dispute report needs. */
export function ProfileForm({
  initial,
  onSaved,
  submitLabel,
}: {
  initial: Profile | null;
  onSaved: (p: Profile) => void;
  submitLabel: string;
}) {
  const t = useT();
  const [lang, setLang] = useLanguage();
  const { setProfile } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(form: FormData) {
    setSaving(true);
    setError(null);
    const preferredLanguage = form.get("preferredLanguage") === "en" ? "en" : "lug";
    const body: Profile = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      preferredLanguage,
      businessName: String(form.get("businessName") ?? ""),
      businessType: String(form.get("businessType") ?? "other"),
      location: String(form.get("location") ?? ""),
    };
    try {
      const { profile } = await api<{ profile: Profile }>("/api/profile", { method: "PUT", body });
      setLang(profile.preferredLanguage);
      setProfile(profile);
      onSaved(profile);
    } catch {
      setError(t("register.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={submit} className="space-y-5">
      <div>
        <label className={label} htmlFor="fullName">
          {t("register.fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          defaultValue={initial?.fullName ?? ""}
          className={input}
        />
      </div>
      <div>
        <label className={label} htmlFor="phone">
          {t("register.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          pattern="\+?[\d\s\-]{9,16}"
          placeholder="0772 123456"
          defaultValue={initial?.phone ?? ""}
          className={input}
          aria-describedby="phone-hint"
        />
        <p id="phone-hint" className="mt-1 text-xs text-ink-3">
          {t("register.phoneHint")}
        </p>
      </div>
      <div>
        <label className={label} htmlFor="businessName">
          {t("register.businessName")}
        </label>
        <input
          id="businessName"
          name="businessName"
          maxLength={80}
          defaultValue={initial?.businessName ?? ""}
          className={input}
        />
      </div>
      <div>
        <label className={label} htmlFor="businessType">
          {t("register.businessType")}
        </label>
        <select
          id="businessType"
          name="businessType"
          defaultValue={initial?.businessType ?? "general_retail"}
          className={input}
        >
          {BUSINESS_TYPES.map((b) => (
            <option key={b} value={b}>
              {t(`businessType.${b}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="location">
          {t("register.location")}
        </label>
        <input
          id="location"
          name="location"
          maxLength={80}
          placeholder="Kikuubo, Kampala"
          defaultValue={initial?.location ?? ""}
          className={input}
        />
      </div>
      <fieldset>
        <legend className={label}>{t("register.language")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["lug", "Oluganda"],
              ["en", "English"],
            ] as const
          ).map(([value, name]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
            >
              <input
                type="radio"
                name="preferredLanguage"
                value={value}
                defaultChecked={(initial?.preferredLanguage ?? lang) === value}
                className="accent-brand-700"
              />
              <span className="font-medium">{name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="flex gap-2 rounded-xl bg-brand-50 p-3 text-xs leading-5 text-brand-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t("register.privacy")}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {saving ? t("register.saving") : submitLabel}
      </button>
    </form>
  );
}

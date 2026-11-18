"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  BUSINESS_CATEGORIES,
  DEMO_PROFILE,
  LICENCE_STATUSES,
  type Profile,
  REGISTRATION_STATUSES,
  profileSchema,
} from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

function Choice<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
            value === option
              ? "border-brand-500 bg-brand-50 font-medium text-brand-900 ring-2 ring-brand-100"
              : "border-line bg-white text-ink hover:border-brand-200"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-brand-700"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export function ProfileForm() {
  const { profile, loaded } = useProfile();
  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-paper" />;
  return <Form initial={profile ?? DEMO_PROFILE} />;
}

function Form({ initial }: { initial: Profile }) {
  const router = useRouter();
  const { save } = useProfile();
  const [draft, setDraft] = useState<Profile>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse(draft);
    if (!parsed.success) {
      setError("Please tell us at least where your business is located.");
      return;
    }
    save(parsed.data);
    router.push("/ask");
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <label htmlFor="businessName" className="text-sm font-semibold text-ink">
          Business name <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="businessName"
          className={field}
          value={draft.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          placeholder="e.g. Nakato General Store"
          autoComplete="organization"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">What kind of business is it?</legend>
        <Choice
          name="category"
          options={BUSINESS_CATEGORIES}
          value={draft.category}
          onChange={(v) => update("category", v)}
        />
      </fieldset>

      <div>
        <label htmlFor="location" className="text-sm font-semibold text-ink">
          Where is it located?
        </label>
        <input
          id="location"
          required
          className={field}
          value={draft.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g. Kikuubo, Kampala"
        />
      </div>

      <div>
        <label htmlFor="operations" className="text-sm font-semibold text-ink">
          What do you do day to day? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="operations"
          rows={2}
          className={field}
          value={draft.operations}
          onChange={(e) => update("operations", e.target.value)}
          placeholder="e.g. Retail shop selling household goods; 2 employees"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Is the business registered?</legend>
        <Choice
          name="registration"
          options={REGISTRATION_STATUSES}
          value={draft.registration}
          onChange={(v) => update("registration", v)}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Your trading licence</legend>
        <Choice
          name="licence"
          options={LICENCE_STATUSES}
          value={draft.licence}
          onChange={(v) => update("licence", v)}
        />
      </fieldset>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted sm:max-w-sm">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Saved only in this browser. We use it to tailor answers and never store it on a server.
          Don&apos;t enter personal ID numbers.
        </p>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Save and ask a question <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

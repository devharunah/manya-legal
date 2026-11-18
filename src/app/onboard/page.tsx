import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Your business | Manya Legal" };

export default function OnboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Step 1 of 2</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
        Tell us about your business
      </h1>
      <p className="mt-3 text-muted">
        Just enough for answers that fit your situation. We have filled in an example Kikuubo
        retailer; change anything that is different for you.
      </p>
      <div className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-8">
        <ProfileForm />
      </div>
    </main>
  );
}

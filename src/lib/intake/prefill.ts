import type { Profile } from "@/lib/cases/types";

import type { FieldKey, Intake } from "./fields";

/**
 * PRD 5.2: don't ask for what we already know. The trader gave these on
 * registration, so they count as their own words.
 */
export function prefillFromProfile(intake: Intake, profile: Profile): Intake {
  const from: [FieldKey, string][] = [
    ["complainant.name", profile.fullName],
    ["complainant.phone", profile.phone],
    ["complainant.business_name", profile.businessName],
  ];
  const values = { ...intake.values };
  for (const [key, value] of from) {
    if (value.trim() && !values[key])
      values[key] = { value: value.trim(), source: "complainant", confirmed: false };
  }
  return { ...intake, values };
}

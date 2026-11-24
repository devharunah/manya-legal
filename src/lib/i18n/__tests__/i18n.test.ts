import { REFERRALS } from "@/data/referrals";
import { BUSINESS_CATEGORIES, LICENCE_STATUSES, REGISTRATION_STATUSES } from "@/lib/profile";

import { type MessageKey, en } from "../en";
import { lug } from "../lug";
import { format, lookup, translate } from "../use-t";

const keys = Object.keys(en) as MessageKey[];

describe("format", () => {
  it("fills {n}", () => {
    expect(format("Source {n}", { n: 3 })).toBe("Source 3");
  });

  it("leaves text without vars alone", () => {
    expect(format("Source {n}")).toBe("Source {n}");
  });
});

describe("translate", () => {
  it("returns Luganda when asked, English otherwise", () => {
    expect(translate("en", "nav.ask")).toBe(en["nav.ask"]);
    expect(translate("lug", "nav.ask")).toBe(lug["nav.ask"]);
  });
});

describe("the Luganda dictionary", () => {
  it("has a non-empty string for every key", () => {
    for (const key of keys) expect(lug[key].trim()).not.toBe("");
  });

  it("keeps every {n} placeholder", () => {
    for (const key of keys.filter((k) => en[k].includes("{n}"))) {
      expect(lug[key]).toContain("{n}");
    }
  });
});

describe("lookup", () => {
  const t = (key: MessageKey) => translate("en", key);

  it("has a label for every profile value the form offers", () => {
    for (const value of [...BUSINESS_CATEGORIES, ...REGISTRATION_STATUSES, ...LICENCE_STATUSES]) {
      expect(`profile.${value}` in en).toBe(true);
    }
  });

  it("has a reason for every referral", () => {
    for (const r of Object.values(REFERRALS)) {
      expect(lookup(t, "referral", r.name)).toBe(r.why);
    }
  });

  it("shows an unknown value as it is", () => {
    expect(lookup(t, "profile", "Something new")).toBe("Something new");
  });
});

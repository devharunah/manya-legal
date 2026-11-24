import { FIELDS } from "@/lib/intake/fields";

import { type MessageKey, en } from "../en";
import { lug } from "../lug";
import { format, lookup, translate } from "../translate";

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
  it("returns Luganda when there is one, English otherwise", () => {
    for (const key of keys) {
      expect(translate("lug", key)).toBe(lug[key] || en[key]);
      expect(translate("en", key)).toBe(en[key]);
    }
  });
});

describe("the Luganda dictionary", () => {
  it("has only known, non-empty keys", () => {
    for (const [key, value] of Object.entries(lug)) {
      expect(key in en).toBe(true);
      expect(value.trim()).not.toBe("");
    }
  });

  it("keeps every {n} placeholder", () => {
    for (const key of keys.filter((k) => en[k].includes("{n}") && lug[k])) {
      expect(lug[key]).toContain("{n}");
    }
  });
});

describe("intake strings", () => {
  it("has a question and a label for every field, and a label for every choice", () => {
    for (const f of FIELDS) {
      expect(`q.${f.key}` in en).toBe(true);
      expect(`field.${f.key}` in en).toBe(true);
      for (const c of "choices" in f ? f.choices : []) {
        expect(`choice.${f.key}.${c}` in en).toBe(true);
      }
    }
  });
});

describe("lookup", () => {
  const t = (key: MessageKey) => translate("en", key);

  it("labels a known key and shows an unknown one as given", () => {
    expect(lookup(t, "choice.requested_resolution.refund", "refund")).toBe("Refund of my money");
    expect(lookup(t, "choice.requested_resolution.barter", "barter")).toBe("barter");
  });
});

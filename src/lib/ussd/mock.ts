import { PROVIDERS, type ProviderStatus } from "@/data/providers";

/**
 * Sample data for the USSD emulator prototype. Every trader, supplier, case
 * and reference here is fictional. The legal lines and provider contacts are
 * NOT invented: each option quotes the curated knowledge base (the chunk ids
 * are checked in tests) and each provider comes from src/data/providers.ts.
 * Legal text stays in English in both languages, as in the web app.
 */

export interface MockCase {
  reference: string;
  supplier: string;
  goods: string;
  amount: number;
  status: string;
  next: string;
}

export const SAMPLE_CASES: readonly MockCase[] = [
  {
    reference: "MNY-0041",
    supplier: "Okello Traders",
    goods: "50 bags of sugar",
    amount: 2_500_000,
    status: "Report ready",
    next: "Choose an option: dial *245*3#",
  },
  {
    reference: "MNY-0039",
    supplier: "Kato Wholesalers",
    goods: "Cooking oil, 20 jerrycans",
    amount: 850_000,
    status: "Evidence needed",
    next: "Keep your mobile money receipt",
  },
];

/** The first reference handed out by a report made in the emulator. */
export const FIRST_NEW_REFERENCE = 42;

export interface LegalOption {
  title: string;
  /** What the law says, then how it may apply. Shown as one USSD screen. */
  text: string;
  /** Knowledge-base chunks the text rests on (src/data/kb/chunks.ts). */
  chunkIds: readonly string[];
}

export const LEGAL_OPTIONS: readonly LegalOption[] = [
  {
    title: "Talk to the supplier",
    text: "Law: the seller must deliver as agreed.\nYou could: ask in writing for goods or refund.\nSrc: Sale of Goods & Supply of Services Act 2018 s.34(1)",
    chunkIds: ["sogssa-s34"],
  },
  {
    title: "Get your money back",
    text: "Law: a buyer may recover money paid if the deal failed, or sue for non-delivery.\nSrc: Sale of Goods & Supply of Services Act 2018 s.66, s.62(1)",
    chunkIds: ["sogssa-s66", "sogssa-s62"],
  },
  {
    title: "Mediation",
    text: "Law: court mediation needs a filed civil case and both sides' consent.\nYou could: get help (menu 4)\nSrc: Court Annexed Mediation Rules 2026 r.3",
    chunkIds: ["med-r3"],
  },
  {
    title: "Small claims court",
    text: "Law: small claims cover cases up to UGX 10,000,000, e.g. supply of goods. Other conditions apply.\nSrc: Small Claims Procedure Rules 2011 r.5(1)",
    chunkIds: ["scp-r5", "scp-leaflet-goods"],
  },
];

const STATUS_LABEL: Record<ProviderStatus, string> = {
  verified: "Verified",
  verification_pending: "Being verified",
  unverified: "Not verified",
  inactive: "Inactive",
};

export interface HelpContact {
  name: string;
  contact: string;
  status: string;
}

const SHORT_NAMES: ReadonlyArray<readonly [id: string, name: string]> = [
  ["justice-centres", "Justice Centres Uganda"],
  ["uls-lap", "ULS Legal Aid Project"],
  ["judiciary-small-claims", "Small Claims courts"],
  ["cadr", "CADR, Ministry of Justice"],
];

/** Legal help, straight from the provider directory, shortened for a small screen. */
export const HELP_CONTACTS: readonly HelpContact[] = SHORT_NAMES.flatMap(([id, name]) => {
  const p = PROVIDERS.find((x) => x.id === id);
  return p ? [{ name, contact: p.contact, status: STATUS_LABEL[p.status] }] : [];
});

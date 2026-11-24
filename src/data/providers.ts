import type { PathwayType } from "@/lib/resolve/pathways";

/**
 * Legal-support directory (PRD 6.4). Institutions only: each entry was
 * checked against its own official source on `lastVerified`. "verified" is
 * used only where we read that source ourselves; anything we saw only
 * through a summary stays "verification_pending".
 */
export type ProviderStatus = "unverified" | "verification_pending" | "verified" | "inactive";

export interface Provider {
  id: string;
  name: string;
  type: "adr_institution" | "court" | "legal_aid";
  /** What the listing rests on: the statute or body that establishes or accredits it. */
  accreditation: string;
  areas: string[];
  location: string;
  contact: string;
  website: string;
  status: ProviderStatus;
  verificationSource: string;
  lastVerified: string;
  /** Pathways this provider can help with. */
  pathways: PathwayType[];
}

export const PROVIDERS: Provider[] = [
  {
    id: "cadr",
    name: "Centre for Arbitration and Dispute Resolution (CADR), Ministry of Justice and Constitutional Affairs",
    type: "adr_institution",
    accreditation:
      "Established under section 67 of the Arbitration and Conciliation Act, Cap. 5, as amended in 2024. A department of the Ministry, no longer an independent body.",
    areas: ["Arbitration", "Conciliation", "Appointing arbitrators and conciliators"],
    location: "JLOS Towers, Plot 98-102 Katalima Road, Naguru, Kampala",
    contact: "+256 41 230537 (Ministry switchboard)",
    website: "https://justice.go.ug/arbitration-and-adrcadr/",
    status: "verified",
    verificationSource:
      "Ministry of Justice CADR page and the Arbitration and Conciliation (Amendment) Act, 2024",
    lastVerified: "2026-11-24",
    pathways: ["arbitration"],
  },
  {
    id: "judiciary-small-claims",
    name: "Small Claims Procedure courts, Judiciary of Uganda",
    type: "court",
    accreditation:
      "Judicature (Small Claims Procedure) Rules, 2011: the High Court Commercial Division, Chief Magistrates' Courts and Magistrate Grade 1 Courts designated by the Chief Justice.",
    areas: [
      "Claims up to UGX 10,000,000",
      "Supply of goods, debts and rent",
      "Court-annexed mediation of filed cases",
    ],
    location: "The court where the dispute arose (rule 9)",
    contact: "Ask the court clerk at your nearest Chief Magistrate's Court",
    website: "https://judiciary.go.ug/files/downloads/Small%20claims%20english%20version.pdf",
    status: "verified",
    verificationSource:
      "S.I. No. 25 of 2011 (official Gazette) and the Judiciary small claims leaflet",
    lastVerified: "2026-11-24",
    pathways: ["small_claims", "mediation"],
  },
  {
    id: "justice-centres",
    name: "Justice Centres Uganda",
    type: "legal_aid",
    accreditation: "A Justice, Law and Order Sector legal aid programme.",
    areas: ["Free legal advice", "Mediation", "Legal representation", "Help representing yourself"],
    location: "Plot 6, George Street, Kampala; centres at courts including Mengo",
    contact: "Toll free 0800 100 212 · 0414 256626 · info@justicecentres.go.ug",
    website: "https://justicecentres.go.ug/",
    status: "verification_pending",
    verificationSource:
      "justicecentres.go.ug (read through a summarising tool; wording to be re-checked)",
    lastVerified: "2026-11-24",
    pathways: [
      "mediation",
      "agreed_mediation",
      "legal_referral",
      "clarify_agreement",
      "small_claims",
    ],
  },
  {
    id: "uls-lap",
    name: "Uganda Law Society Legal Aid Project",
    type: "legal_aid",
    accreditation: "Established by the Uganda Law Society.",
    areas: ["Legal advice and counselling", "Mediation", "Legal representation"],
    location: "Plot 5A, John Babiha (Acacia) Avenue, Kampala",
    contact: "Toll free 0800 355 355 · 0414 342 424 · uls@uls.or.ug",
    website: "https://uls.or.ug/about-lap/",
    status: "verification_pending",
    verificationSource: "uls.or.ug (read through a summarising tool; wording to be re-checked)",
    lastVerified: "2026-11-24",
    pathways: ["mediation", "agreed_mediation", "legal_referral", "clarify_agreement"],
  },
];

export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id);

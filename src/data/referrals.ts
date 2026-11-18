export interface Referral {
  name: string;
  why: string;
  url: string;
}

/** Where to go next when the answer needs a human (brief 3.4 and 6.1). */
export const REFERRALS = {
  kcca: {
    name: "Kampala Capital City Authority (KCCA)",
    why: "Issues and renews trading licences in Kampala and sets fees by area.",
    url: "https://www.kcca.go.ug",
  },
  ura: {
    name: "Uganda Revenue Authority (URA)",
    why: "TIN registration and tax obligations. Toll free 0800217000.",
    url: "https://ura.go.ug",
  },
  ursb: {
    name: "Uganda Registration Services Bureau (URSB)",
    why: "Business name and company registration.",
    url: "https://ursb.go.ug",
  },
  uls: {
    name: "Uganda Law Society Legal Aid Project",
    why: "Free or low-cost legal advice and representation.",
    url: "https://uls.or.ug",
  },
  justiceCentres: {
    name: "Justice Centres Uganda",
    why: "Free legal aid for people who cannot afford a lawyer.",
    url: "https://www.justicecentres.go.ug",
  },
} satisfies Record<string, Referral>;

export const LICENSING_REFERRALS: Referral[] = [REFERRALS.kcca, REFERRALS.ura, REFERRALS.ursb];
export const LEGAL_AID_REFERRALS: Referral[] = [REFERRALS.uls, REFERRALS.justiceCentres];

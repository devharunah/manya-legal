/**
 * USSD menu text. Short on purpose: a USSD screen holds about 182
 * characters. The Luganda is a first draft and needs review by a Luganda
 * speaker; legal text is never translated (see mock.ts).
 */
export type Lang = "en" | "lug";

export const USSD_TEXT = {
  en: {
    home: "Welcome to MANYA\n1. Report a dispute\n2. My cases\n3. Know your options\n4. Get legal help\n5. Language\n0. Exit",
    bye: "Thank you for using MANYA. Dial *245# any time.",
    invalid: "Invalid choice.",
    back: "0. Back",
    nav: "0. Back 00. Menu",
    supplier: "Report a dispute (1/7)\nSupplier's name or business:",
    goods: "(2/7) What did you buy?\ne.g. 50 bags of sugar",
    amount: "(3/7) How much did you pay? (UGX)\ne.g. 2500000",
    paid: "(4/7) How did you pay?\n1. Mobile money\n2. Bank\n3. Cash\n4. Other",
    delivery: "(5/7) What happened?\n1. Nothing delivered\n2. Part delivered\n3. Delivered late",
    agreement: "(6/7) How did you agree?\n1. Written\n2. Verbal\n3. WhatsApp",
    want: "(7/7) What do you want?\n1. My money back\n2. The goods\n3. Either",
    confirm: "Confirm:\n{supplier}\n{goods}\nUGX {amount}\n1. Submit\n2. Cancel",
    saved: "Case {ref} saved. You will get an SMS. Dial *245*2# to check it.",
    cancelled: "Report cancelled. Nothing was saved.",
    sms: "MANYA: Case {ref} saved. Supplier: {supplier}. Amount: UGX {amount}. Dial *245*2# to follow up. Free legal help: Justice Centres 0800 100 212.",
    cases: "My cases",
    noCases: "You have no cases yet. Dial *245*1# to report one.",
    caseDetail: "{ref} {supplier}\n{goods}, UGX {amount}\nStatus: {status}\nNext: {next}",
    options: "Your options (info, not legal advice)",
    help: "Get legal help",
    language: "Language / Olulimi\n1. English\n2. Oluganda",
    languageSet: "Language: English.",
  },
  lug: {
    home: "Tukwanirizza ku MANYA\n1. Waaba ensonga\n2. Emisango gyange\n3. Ebiyinza okukolebwa\n4. Obuyambi mu by'amateeka\n5. Olulimi\n0. Fuluma",
    bye: "Webale okukozesa MANYA. Kuba *245# essaawa yonna.",
    invalid: "Ky'olonze tekituufu.",
    back: "0. Ddayo",
    nav: "0. Ddayo 00. Menu",
    supplier: "Waaba ensonga (1/7)\nErinnya ly'omutunzi oba bizineesi:",
    goods: "(2/7) Wagula ki?\nng'ensawo 50 eza sukaali",
    amount: "(3/7) Wasasula ssente mmeka? (UGX)\nng'2500000",
    paid: "(4/7) Wasasula otya?\n1. Mobile money\n2. Bbanka\n3. Ssente enkalu\n4. Endala",
    delivery:
      "(5/7) Kiki ekyabaawo?\n1. Tewali kyaleetebwa\n2. Ebimu byaleetebwa\n3. Byaleetebwa kikeerezi",
    agreement: "(6/7) Mwakkiriziganya mutya?\n1. Mu buwandiike\n2. Mu kamwa\n3. Ku WhatsApp",
    want: "(7/7) Oyagala ki?\n1. Ssente zange\n2. Ebintu\n3. Kimu ku ebyo",
    confirm: "Kakasa:\n{supplier}\n{goods}\nUGX {amount}\n1. Sindika\n2. Komya",
    saved: "Ensonga {ref} eterekeddwa. Ojja kufuna SMS. Kuba *245*2# okugirondoola.",
    cancelled: "Okuwaaba kukomezeddwa. Tewali kyaterekeddwa.",
    sms: "MANYA: Ensonga {ref} eterekeddwa. Omutunzi: {supplier}. Ssente: UGX {amount}. Kuba *245*2#. Obuyambi obw'obwereere: Justice Centres 0800 100 212.",
    cases: "Emisango gyange",
    noCases: "Tolina nsonga yonna. Kuba *245*1# okuwaaba.",
    caseDetail: "{ref} {supplier}\n{goods}, UGX {amount}\nEmbeera: {status}\nEkiddako: {next}",
    options: "Ebiyinza okukolebwa (si magezi ga mateeka)",
    help: "Obuyambi mu by'amateeka",
    language: "Language / Olulimi\n1. English\n2. Oluganda",
    languageSet: "Olulimi: Oluganda.",
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type UssdKey = keyof (typeof USSD_TEXT)["en"];

export function say(lang: Lang, key: UssdKey, vars: Record<string, string> = {}): string {
  return USSD_TEXT[lang][key].replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m);
}

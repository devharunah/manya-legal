import type { Source } from "@/lib/kb/types";

/**
 * Official sources behind MANYA's resolution guidance. Every one was fetched
 * on the `accessed` date from the URL shown; nothing is written from memory.
 */
export const SOURCES: Source[] = [
  {
    id: "sogssa",
    title:
      "The Sale of Goods and Supply of Services Act, 2018 (Act 10 of 2018), Acts Supplement No. 3 to The Uganda Gazette No. 43, 17 August 2018",
    shortTitle: "Sale of Goods and Supply of Services Act",
    publisher: "Uganda Printing and Publishing Corporation (official Gazette, via Gazettes.Africa)",
    kind: "statute",
    url: "https://archive.gazettes.africa/archive/ug/2018/ug-government-gazette-dated-2018-08-17-no-43.pdf",
    asOf: "2018-08-17",
    accessed: "2026-11-24",
    currency: "current",
    currencyNote:
      "Text as enacted (commenced 17 August 2018); no amending Act found. Sometimes called the 2017 Act. Its chapter number in the 2023 revised edition was not verified.",
  },
  {
    id: "scp-rules",
    title: "The Judicature (Small Claims Procedure) Rules, 2011 (S.I. No. 25 of 2011)",
    shortTitle: "Small Claims Procedure Rules",
    publisher: "Uganda Printing and Publishing Corporation (official Gazette, via Gazettes.Africa)",
    kind: "regulation",
    url: "https://archive.gazettes.africa/archive/ug/2011/ug-government-gazette-dated-2011-05-27-no-36.pdf",
    asOf: "2011-05-30",
    accessed: "2026-11-24",
    currency: "current",
    currencyNote:
      "Text as made (in force 30 May 2011). No amendment to the UGX 10,000,000 limit was found. Rules 8(2)-(3) and 24 were reportedly struck down by the Constitutional Court in 2021 and that ruling was reportedly stayed by the Supreme Court; their current status is unresolved.",
  },
  {
    id: "scp-leaflet",
    title: "The Small Claims Procedure (information leaflet), Courts of Judicature",
    shortTitle: "Judiciary small claims leaflet",
    publisher: "Judiciary of Uganda",
    kind: "official-guidance",
    url: "https://judiciary.go.ug/files/downloads/Small%20claims%20english%20version.pdf",
    asOf: null,
    accessed: "2026-11-24",
    currency: "historical",
    currencyNote:
      "Undated leaflet from about 2012, before the 2021 court rulings on legal representation. Use it as background only.",
  },
  {
    id: "aca",
    title:
      "Arbitration and Conciliation Act, Chapter 5 (consolidated as at 23 December 2024, including Act 44 of 2024)",
    shortTitle: "Arbitration and Conciliation Act",
    publisher: "ULII / Laws.Africa consolidation, via WIPO Lex",
    kind: "statute",
    url: "https://www.wipo.int/wipolex/en/legislation/details/24066",
    asOf: "2024-12-23",
    accessed: "2026-11-24",
    currency: "current",
    currencyNote:
      "Consolidated text, not the official Gazette. Includes the 2024 amendment that made CADR a department of the Ministry of Justice and Constitutional Affairs.",
  },
  {
    id: "cadr-page",
    title: "Arbitration and ADR (CADR), Ministry of Justice and Constitutional Affairs",
    shortTitle: "CADR page, Ministry of Justice",
    publisher: "Ministry of Justice and Constitutional Affairs",
    kind: "official-guidance",
    url: "https://justice.go.ug/arbitration-and-adrcadr/",
    asOf: null,
    accessed: "2026-11-24",
    currency: "current",
    currencyNote: "Undated web page; lists no public mediation service or fees.",
  },
  {
    id: "mediation-2026",
    title: "The Judicature (Court Annexed Mediation) Rules, 2026 (S.I. No. 14 of 2026)",
    shortTitle: "Court Annexed Mediation Rules, 2026",
    publisher: "Uganda Printing and Publishing Corporation, published by the Judiciary of Uganda",
    kind: "regulation",
    url: "https://judiciary.go.ug/files/downloads/The%20Judicature%20(Court%20Annexed%20Mediation)%20Rules,%202026.pdf",
    asOf: "2026-03-27",
    accessed: "2026-11-24",
    currency: "current",
    currencyNote:
      "Gazetted 27 March 2026; revokes the Judicature (Mediation) Rules, 2013. Applies to cases already filed in court where both parties consent.",
  },
];

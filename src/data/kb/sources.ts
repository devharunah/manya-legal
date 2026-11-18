import type { Source } from "@/lib/kb/types";

export const SOURCES: Source[] = [
  {
    id: "tla",
    title:
      "Trade (Licensing) Act, Chapter 79 (formerly Cap. 101), revised edition as at 31 December 2000",
    shortTitle: "Trade (Licensing) Act",
    publisher: "Uganda Legal Information Institute (ULII) / Laws.Africa",
    kind: "statute",
    url: "https://ulii.org/akn/ug/act/1969/14/eng@2000-12-31",
    asOf: "2000-12-31",
    accessed: "2026-11-18",
    currency: "historical",
    currencyNote:
      "This is the official text as it stood from 2000 to 2011. The Act was amended in 2015 (Trade (Licensing) (Amendment) Act, 2015) and revised again as at 31 December 2023. Penalty amounts and the licence period shown here have since changed. Check the current revised edition on ULII before relying on exact wording.",
  },
  {
    id: "tla-amendment-2015",
    title: "Trade (Licensing) (Amendment) Act, 2015 (Act 6 of 2015)",
    shortTitle: "Trade (Licensing) (Amendment) Act, 2015",
    publisher: "Parliament of Uganda",
    kind: "statute",
    url: "https://commons.laws.africa/akn/ug/act/2015/6/media/publication/ug-act-2015-6-publication-document.pdf",
    asOf: null,
    accessed: "2026-11-18",
    currency: "secondary",
    currencyNote:
      "We describe this amendment from KCCA and URA guidance, not from the Act's own text. Confirm specific provisions and penalty amounts in the Act itself or with KCCA.",
  },
  {
    id: "ura-formalisation",
    title: "Formalising a Business, Vol. 1 Issue 2, FY 2024-25",
    shortTitle: "URA: Formalising a Business (2024-25)",
    publisher: "Uganda Revenue Authority",
    kind: "official-guidance",
    url: "https://ura.go.ug/storage/2024/01/BUSINESS-FORMALISATION-ENGLISH-FY-2024-25.pdf",
    asOf: "2024-07-01",
    accessed: "2026-11-18",
    currency: "current",
    currencyNote:
      "Official URA guidance for FY 2024-25. URA notes it is for guidance and may change when tax laws or regulations are amended.",
  },
  {
    id: "kcca-trade-licence",
    title: "Trading Licence: Frequently Asked Questions",
    shortTitle: "KCCA Trading Licence FAQs",
    publisher: "Kampala Capital City Authority",
    kind: "official-guidance",
    url: "https://www.kcca.go.ug/uDocs/Trade_Licence_FAQs.pdf",
    asOf: null,
    accessed: "2026-11-18",
    currency: "secondary",
    currencyNote:
      "KCCA's own summary of trading-licence rules in Kampala. Fees and procedures are set by KCCA and can change; confirm at a KCCA division office or kcca.go.ug.",
  },
  {
    id: "kcca-trading-licence-notice",
    title: "Trading Licence notice: The Trade (Licensing) Act, Cap. 101",
    shortTitle: "KCCA Trading Licence notice",
    publisher: "Kampala Capital City Authority",
    kind: "official-guidance",
    url: "https://www.kcca.go.ug/uploads/Trading%20Licence.pdf",
    asOf: null,
    accessed: "2026-11-18",
    currency: "secondary",
    currencyNote:
      "KCCA's public notice summarising offences under the Act as amended. It does not state the current fine amount; confirm with KCCA or the amended Act.",
  },
  {
    id: "grading-2017",
    title: "Trade (Licensing) (Grading of Business Areas) Instrument, 2017 (S.I. No. 1 of 2017)",
    shortTitle: "Grading of Business Areas Instrument, 2017",
    publisher: "Minister of Trade, Industry and Cooperatives (via ULII)",
    kind: "regulation",
    url: "https://ulii.org/en/search/?q=Trade+(Licensing)+(Grading+of+Business+Areas)+Instrument",
    asOf: "2017-01-13",
    accessed: "2026-11-18",
    currency: "current",
    currencyNote:
      "Grades business areas for licence-fee purposes. Fee amounts are set in the Schedule and by KCCA and may have been revised; confirm the fee for your area with KCCA.",
  },
];

export function getSource(id: string): Source {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source ${id}`);
  return source;
}

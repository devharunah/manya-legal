/**
 * Legal currency of a chunk. The brief (6.5) forbids presenting an outdated
 * document as current law, so every chunk says where it stands.
 * - current: official guidance or law we believe reflects the present position.
 * - historical: official text of an older version; later amendments changed parts of it.
 * - secondary: a summary of the law by an authority, not the statute text itself.
 */
export type Currency = "current" | "historical" | "secondary";

export type SourceKind = "statute" | "regulation" | "official-guidance";

export interface Source {
  id: string;
  title: string;
  shortTitle: string;
  publisher: string;
  kind: SourceKind;
  url: string;
  /** Date the text is stated to be valid as at, ISO yyyy-mm-dd; null when the publisher gives none. */
  asOf: string | null;
  /** When we last checked the source, ISO yyyy-mm-dd. */
  accessed: string;
  currency: Currency;
  /** Shown wherever this source is cited. */
  currencyNote: string;
}

export interface Chunk {
  id: string;
  sourceId: string;
  /** "Section 8" or "Step 3: Trading licence". */
  locator: string;
  heading: string;
  /** Verbatim statute text, or a close summary of official guidance. */
  text: string;
  textKind: "verbatim" | "summary";
  /** Overrides the source currency where one provision is known to be superseded. */
  currency?: Currency;
  currencyNote?: string;
  /** Extra plain-language terms traders use, to help retrieval. */
  keywords: string[];
}

export interface RetrievedChunk {
  chunk: Chunk;
  source: Source;
  score: number;
}

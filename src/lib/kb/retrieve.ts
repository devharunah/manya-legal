import { CHUNKS } from "@/data/kb/chunks";
import { getSource } from "@/data/kb/sources";

import type { Chunk, RetrievedChunk } from "./types";

/**
 * A small, deterministic BM25 retriever over the curated knowledge base.
 * No embeddings: every ranking can be explained and unit tested, and the
 * corpus is small enough that lexical search with synonyms is enough.
 */

const STOPWORDS = new Set(
  "a an and are as at be been but by can could did do does doing for from get got had has have how i if in into is it its me my of on or our shall should so that the their them then there these they this to up us was we what when where which who why will with would you your am im i'm".split(
    " ",
  ),
);

/** Trader vocabulary mapped onto the words the sources use. */
const SYNONYMS: Record<string, string[]> = {
  license: ["licence"],
  licenses: ["licence"],
  licensed: ["licence"],
  licences: ["licence"],
  licensing: ["licence"],
  unlicensed: ["without", "licence"],
  permit: ["licence"],
  permission: ["licence"],
  shop: ["trade", "premises"],
  store: ["trade", "premises"],
  kiosk: ["trade", "premises"],
  stall: ["trade", "premises"],
  jail: ["imprisonment", "penalty"],
  prison: ["imprisonment", "penalty"],
  arrested: ["penalty", "offence"],
  punishment: ["penalty"],
  punished: ["penalty"],
  fined: ["fine", "penalty"],
  cost: ["fee"],
  price: ["fee"],
  charge: ["fee"],
  expiring: ["expire", "renew"],
  expires: ["expire", "renew"],
  expired: ["expire", "renew"],
  lapse: ["expire", "renew"],
  papers: ["documents"],
  paperwork: ["documents"],
  tax: ["tin"],
  taxes: ["tin", "tax"],
};

/** A question must touch at least one of these to count as in scope. */
const DOMAIN_TERMS = new Set([
  "licence",
  "trade",
  "trading",
  "tin",
  "tax",
  "ura",
  "ursb",
  "kcca",
  "regist",
  "fee",
  "renew",
  "renewal",
  "expire",
  "inspect",
  "inspection",
  "operat",
  "legally",
  "formal",
  "formalis",
  "book",
  "record",
  "premis",
  "hawker",
  "revok",
  "revoke",
]);

function stem(token: string): string {
  if (token.length <= 4) return token;
  for (const suffix of ["ations", "ation", "ings", "ing", "ies", "ed", "es", "s"]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

export function tokenize(text: string, { expand = true }: { expand?: boolean } = {}): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  const out: string[] = [];
  for (const token of raw) {
    out.push(stem(token));
    if (expand) for (const syn of SYNONYMS[token] ?? []) out.push(stem(syn));
  }
  return out;
}

interface IndexedDoc {
  chunk: Chunk;
  tf: Map<string, number>;
  length: number;
}

function buildIndex(chunks: Chunk[]) {
  const docs: IndexedDoc[] = chunks.map((chunk) => {
    // Headings and keywords say what a chunk is about; weight them above body text.
    const tokens = [
      ...tokenize(chunk.heading),
      ...tokenize(chunk.heading),
      ...tokenize(chunk.keywords.join(" ")),
      ...tokenize(chunk.keywords.join(" ")),
      ...tokenize(chunk.text),
    ];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk, tf, length: tokens.length };
  });

  const df = new Map<string, number>();
  for (const doc of docs) for (const term of doc.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);

  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(docs.length, 1);
  return { docs, df, avgLength, n: docs.length };
}

const INDEX = buildIndex(CHUNKS);
const K1 = 1.2;
const B = 0.75;

export function scoreAll(query: string): { chunk: Chunk; score: number }[] {
  const terms = [...new Set(tokenize(query))];
  return INDEX.docs
    .map((doc) => {
      let score = 0;
      for (const term of terms) {
        const f = doc.tf.get(term);
        if (!f) continue;
        const n = INDEX.df.get(term) ?? 0;
        const idf = Math.log(1 + (INDEX.n - n + 0.5) / (n + 0.5));
        score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / INDEX.avgLength)));
      }
      return { chunk: doc.chunk, score };
    })
    .sort((a, b) => b.score - a.score);
}

// Checked on the trader's own words, without synonyms: "shop" alone must not
// pull an employment question into the trade-licensing domain.
export function isInDomain(query: string): boolean {
  return tokenize(query, { expand: false }).some((t) =>
    [...DOMAIN_TERMS].some((d) => t.startsWith(d)),
  );
}

export const MIN_SCORE = 3;
const MAX_HITS = 6;

export interface Retrieval {
  covered: boolean;
  hits: RetrievedChunk[];
}

/**
 * The first half of the refusal gate (brief 6.2): if the question is outside
 * our domain or nothing in the knowledge base matches well, we say so and do
 * not ask the model to answer from its own memory.
 */
export function retrieve(query: string): Retrieval {
  const ranked = scoreAll(query);
  const top = ranked[0]?.score ?? 0;
  const covered = isInDomain(query) && top >= MIN_SCORE;
  if (!covered) return { covered: false, hits: [] };

  const hits = ranked
    .filter((r) => r.score >= top * 0.3)
    .slice(0, MAX_HITS)
    .map((r) => ({ chunk: r.chunk, source: getSource(r.chunk.sourceId), score: r.score }));
  return { covered: true, hits };
}

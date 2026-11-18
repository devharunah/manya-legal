import { CHUNKS } from "@/data/kb/chunks";
import { getSource } from "@/data/kb/sources";

import type { Chunk, RetrievedChunk } from "./types";

/**
 * A small, deterministic BM25 retriever over the curated knowledge base.
 * No embeddings: every ranking can be explained and unit tested, and the
 * corpus is small enough that lexical search with synonyms is enough.
 */

const STOPWORDS = new Set(
  "a an and are as at be been but by can could did do does doing for from got had has have how i if in into is it its me my of on or our shall should so that the their them then there these they this to up us was we what when which why will with would you your am im i'm".split(
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

/**
 * Word families folded to one root before stemming, so "licences", "licensing"
 * and "license" all match "licence", and "trading"/"trader" match "trade".
 */
const CANONICAL: [RegExp, string][] = [
  [/^licen[cs](e|es|ed|ing)?$/, "licence"],
  [/^unlicen[cs]ed$/, "licence"],
  [/^trad(e|es|er|ers|ing)$/, "trade"],
  [/^regist(er|ers|ered|ering|ration|rations)$/, "register"],
  [/^renew(al|als|ed|ing|s)?$/, "renew"],
  [/^expir(e|es|ed|ing|y)$/, "expire"],
  [/^document(s|ation)?$/, "document"],
  [/^inspect(ion|ions|or|ors|ed|ing|s)?$/, "inspect"],
  [/^tax(es)?$/, "tax"],
  [/^issu(e|es|ed|ing)$/, "issue"],
  [/^(get|gets|getting|obtain|obtains|obtaining|acquire)$/, "obtain"],
];

/** Any of these (after folding) puts a question squarely in our domain. */
const CORE_TERMS = new Set([
  "licence",
  "trade",
  "register",
  "renew",
  "expire",
  "inspect",
  "kcca",
  "ura",
  "ursb",
  "tin",
  "tax",
  "hawker",
]);

/**
 * Topics we explicitly do not cover yet. A question about them is refused
 * unless it is also about licensing (e.g. "can my landlord evict me for not
 * having a trading licence?").
 */
const OUT_OF_SCOPE = new Set([
  "divorce",
  "marriage",
  "married",
  "custody",
  "land",
  "inheritance",
  "inherit",
  "succession",
  "estate",
  "employee",
  "employees",
  "worker",
  "workers",
  "staff",
  "dismiss",
  "fire",
  "sack",
  "salary",
  "wage",
  "wages",
  "landlord",
  "evict",
  "eviction",
  "rent",
  "theft",
  "stole",
  "assault",
  "accident",
  "loan",
  "debt",
]);

function fold(token: string): string {
  for (const [pattern, root] of CANONICAL) if (pattern.test(token)) return root;
  return token;
}

function stem(token: string): string {
  const folded = fold(token);
  if (folded !== token || folded.length <= 4) return folded;
  for (const suffix of ["ations", "ation", "ings", "ing", "ies", "ed", "es", "s"]) {
    if (folded.endsWith(suffix) && folded.length - suffix.length >= 4) {
      return folded.slice(0, -suffix.length);
    }
  }
  return folded;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function tokenize(text: string, { expand = true }: { expand?: boolean } = {}): string[] {
  const out: string[] = [];
  for (const token of words(text)) {
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
  return tokenize(query, { expand: false }).some((t) => CORE_TERMS.has(t));
}

export function isOutOfScope(query: string): boolean {
  return words(query).some((w) => OUT_OF_SCOPE.has(w));
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
  // Licensing vocabulary is enough on its own; otherwise we need a strong
  // match and no sign of a topic we don't cover yet.
  const covered = top > 0 && (isInDomain(query) || (top >= MIN_SCORE && !isOutOfScope(query)));
  if (!covered) return { covered: false, hits: [] };

  const hits = ranked
    .filter((r) => r.score >= top * 0.3)
    .slice(0, MAX_HITS)
    .map((r) => ({ chunk: r.chunk, source: getSource(r.chunk.sourceId), score: r.score }));
  return { covered: true, hits };
}

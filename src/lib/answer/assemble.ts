import { CHUNKS } from "@/data/kb/chunks";
import { LEGAL_AID_REFERRALS, LICENSING_REFERRALS } from "@/data/referrals";
import type { RetrievedChunk } from "@/lib/kb/types";

import type { Answer, CitedSource, ModelAnswer } from "./types";

export function toCitedSource(hit: RetrievedChunk): CitedSource {
  return {
    chunkId: hit.chunk.id,
    locator: hit.chunk.locator,
    heading: hit.chunk.heading,
    text: hit.chunk.text,
    textKind: hit.chunk.textKind,
    currency: hit.chunk.currency ?? hit.source.currency,
    currencyNote: hit.chunk.currencyNote ?? hit.source.currencyNote,
    sourceTitle: hit.source.title,
    sourceShortTitle: hit.source.shortTitle,
    publisher: hit.source.publisher,
    url: hit.source.url,
    asOf: hit.source.asOf,
  };
}

// Money amounts written the way Ugandan sources and models write them.
const AMOUNT = /\b(?:UGX|USh|Shs?\.?)\s?[\d,.]+|\b[\d,.]+\s?(?:shillings|UGX|\/=)/gi;

function amountsIn(text: string): string[] {
  return (text.match(AMOUNT) ?? []).map((a) => a.replace(/\s+/g, " ").trim());
}

const KB_TEXT = CHUNKS.map((c) => c.text).join("\n");

/**
 * The second half of the refusal gate: whatever the model says, only citations
 * to chunks we actually retrieved survive, and an unsupported claim is marked.
 */
export function validateModelAnswer(model: ModelAnswer, hits: RetrievedChunk[]): Answer {
  const retrieved = new Map(hits.map((h) => [h.chunk.id, h]));
  const warnings: string[] = [];

  const lawSays = model.lawSays.map((item) => {
    const chunkIds = [...new Set(item.chunkIds)].filter((id) => retrieved.has(id));
    return { point: item.point, chunkIds, supported: chunkIds.length > 0 };
  });

  const unsupported = lawSays.filter((l) => !l.supported).length;
  if (unsupported > 0) {
    warnings.push(
      `${unsupported} statement${unsupported > 1 ? "s" : ""} could not be matched to a source and ${unsupported > 1 ? "are" : "is"} marked. Do not rely on ${unsupported > 1 ? "them" : "it"}.`,
    );
  }

  const fullText = [
    model.directAnswer,
    model.meansForYou,
    ...model.nextSteps,
    ...lawSays.map((l) => l.point),
  ].join("\n");
  const invented = amountsIn(fullText).filter((a) => !KB_TEXT.includes(a));
  if (invented.length > 0) {
    warnings.push(
      `The amount ${invented.join(", ")} does not appear in our sources. Confirm any fee or fine with the authority before relying on it.`,
    );
  }

  const citedIds = new Set(lawSays.flatMap((l) => l.chunkIds));
  const cited = hits.filter((h) => citedIds.has(h.chunk.id));
  const sources = (cited.length > 0 ? cited : model.status === "not_covered" ? [] : hits).map(
    toCitedSource,
  );

  let status = model.status;
  if (status === "answered" && cited.length === 0) status = "partial";

  if (sources.some((s) => s.currency === "historical")) {
    warnings.push(
      "Some text shown is from an older version of the law, kept for reference. Where it differs, the newer guidance applies.",
    );
  }

  return {
    status,
    mode: "ai",
    directAnswer: model.directAnswer,
    lawSays,
    meansForYou: model.meansForYou,
    nextSteps: model.nextSteps,
    clarifyingQuestions: model.clarifyingQuestions,
    uncertainty: model.uncertainty,
    needsLawyer: model.needsLawyer,
    sources,
    referrals:
      model.needsLawyer || status === "not_covered"
        ? [...LICENSING_REFERRALS, ...LEGAL_AID_REFERRALS]
        : LICENSING_REFERRALS,
    warnings,
  };
}

export function refusal(): Answer {
  return {
    status: "not_covered",
    mode: "sources-only",
    directAnswer:
      "Our verified sources do not cover this question yet, so we will not guess. For now Manya Legal covers trading licences, business registration and related compliance for small traders.",
    lawSays: [],
    meansForYou:
      "We would rather tell you we don't know than give you legal information we cannot back with an official source.",
    nextSteps: [
      "If it is about your trading licence, registration or tax, try rephrasing with those words.",
      "For anything else, speak to a lawyer or one of the free legal aid services below.",
    ],
    clarifyingQuestions: [],
    uncertainty: "This topic is not in our knowledge base.",
    needsLawyer: true,
    sources: [],
    referrals: LEGAL_AID_REFERRALS,
    warnings: [],
  };
}

/**
 * No model call: shows the matching provisions themselves. Used when no API key
 * is configured, when the model call fails, and in e2e tests.
 */
export function sourcesOnly(hits: RetrievedChunk[]): Answer {
  // Without a model to explain currency, show current material before older text.
  const rank = (h: RetrievedChunk) =>
    (h.chunk.currency ?? h.source.currency) === "historical" ? 1 : 0;
  const top = [...hits].sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  return {
    status: "partial",
    mode: "sources-only",
    directAnswer:
      "Here are the official provisions that best match your question. The plain-language explanation is not available right now, so read these directly and confirm with the authority.",
    lawSays: top.map((h) => ({ point: h.chunk.heading, chunkIds: [h.chunk.id], supported: true })),
    meansForYou:
      "Read each source below; the status label tells you whether it reflects the current position.",
    nextSteps: ["Confirm the current requirement with KCCA (or your local council) before acting."],
    clarifyingQuestions: [],
    uncertainty: "These are the raw sources without interpretation.",
    needsLawyer: false,
    sources: top.map(toCitedSource),
    referrals: LICENSING_REFERRALS,
    warnings: [],
  };
}

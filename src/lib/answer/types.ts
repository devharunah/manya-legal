import { z } from "zod";

import type { Referral } from "@/data/referrals";
import type { Currency } from "@/lib/kb/types";

/** What the model must return. Every field required, so OpenAI strict mode accepts it. */
export const modelAnswerSchema = z.object({
  status: z
    .enum(["answered", "partial", "not_covered"])
    .describe(
      "answered: the sources fully support the answer. partial: they cover part of it. not_covered: they do not address the question.",
    ),
  directAnswer: z
    .string()
    .describe("Two or three plain sentences that answer the question directly, for a shop owner."),
  lawSays: z
    .array(
      z.object({
        point: z
          .string()
          .describe(
            "One requirement stated by a source, in plain words, keeping the legal meaning.",
          ),
        chunkIds: z.array(z.string()).describe("Ids of the source chunks that state this point."),
      }),
    )
    .describe("What the law or official guidance says. Only points a chunk supports."),
  meansForYou: z
    .string()
    .describe(
      "What this means for this particular business, using its profile. Conditional, not certain.",
    ),
  nextSteps: z.array(z.string()).describe("Concrete actions, in order, each one short."),
  clarifyingQuestions: z
    .array(z.string())
    .describe("Facts that would change the answer. Empty if none."),
  uncertainty: z
    .string()
    .describe(
      "What the sources do not settle or may be out of date, and what to verify and where.",
    ),
  needsLawyer: z.boolean().describe("True when the situation needs professional legal help."),
});

export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

export interface CitedSource {
  chunkId: string;
  locator: string;
  heading: string;
  text: string;
  textKind: "verbatim" | "summary";
  currency: Currency;
  currencyNote: string;
  sourceTitle: string;
  sourceShortTitle: string;
  publisher: string;
  url: string;
  asOf: string | null;
}

export interface Answer {
  status: ModelAnswer["status"];
  /** ai: explained by the model. sources-only: no model call, matching provisions shown. */
  mode: "ai" | "sources-only";
  directAnswer: string;
  lawSays: { point: string; chunkIds: string[]; supported: boolean }[];
  meansForYou: string;
  nextSteps: string[];
  clarifyingQuestions: string[];
  uncertainty: string;
  needsLawyer: boolean;
  sources: CitedSource[];
  referrals: Referral[];
  warnings: string[];
}

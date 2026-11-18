/**
 * The demo and regression set from the brief (section 4 and 8). Each in-scope
 * question names chunks that must be retrieved; out-of-scope questions must be
 * refused before any model call.
 */
export interface EvalCase {
  id: string;
  question: string;
  expect: "answer" | "refuse";
  /** Chunks that must appear among the retrieved hits. */
  mustRetrieve?: string[];
  /** What a lawyer reviewing the answer should see. */
  reviewNotes: string;
}

export const EVALS: EvalCase[] = [
  {
    id: "scenario-1-requirements",
    question: "What do I need to legally operate my retail shop in Kampala?",
    expect: "answer",
    mustRetrieve: ["ura-formal-business", "tla-s8-1"],
    reviewNotes:
      "Names the three registrations (URSB, TIN, KCCA trading licence), cites s.8(1), points to KCCA for the licence and notes other licences may apply (s.33).",
  },
  {
    id: "scenario-2-no-licence",
    question: "What could happen if I operate my shop without the required trading licence?",
    expect: "answer",
    mustRetrieve: ["kcca-notice-offence"],
    reviewNotes:
      "Says it is an offence (s.8(1)), possible fine and/or up to 12 months imprisonment per KCCA, court may revoke or disqualify; does NOT state a fine amount; recommends regularising quickly.",
  },
  {
    id: "scenario-3-renewal",
    question: "My trading licence is expiring. What should I do?",
    expect: "answer",
    mustRetrieve: ["ura-step3-licence", "ura-licence-requirements"],
    reviewNotes:
      "12 months from issue (not the 31 December rule), renew immediately, bring previous licence + KCCA receipt + ID + TIN; flags s.13 as historical.",
  },
  {
    id: "in-scope-fees",
    question: "How much does a trading licence cost?",
    expect: "answer",
    mustRetrieve: ["grading-fees"],
    reviewNotes:
      "Explains fee depends on trade and area grade; does not invent a figure; refers to KCCA.",
  },
  {
    id: "in-scope-tin",
    question: "Do I need a TIN for my business?",
    expect: "answer",
    mustRetrieve: ["ura-step2-tin"],
    reviewNotes: "Anyone with income-generating activity must register; how to apply online.",
  },
  {
    id: "regression-where-licence",
    question: "Where do I get a trading licence?",
    expect: "answer",
    mustRetrieve: ["tla-s9"],
    reviewNotes:
      "KCCA in Kampala (town clerk / district elsewhere under s.9). Was wrongly refused.",
  },
  {
    id: "regression-documents-open-shop",
    question: "What documents do I need to open a shop?",
    expect: "answer",
    mustRetrieve: ["ura-licence-requirements"],
    reviewNotes: "Lists URSB, TIN and trading licence documents. Was wrongly refused.",
  },
  {
    id: "regression-start-business",
    question: "How do I start a business in Kampala?",
    expect: "answer",
    mustRetrieve: ["ura-formal-business"],
    reviewNotes: "Three registrations: URSB, TIN, KCCA licence.",
  },
  {
    id: "regression-who-issues",
    question: "Who issues trading licences?",
    expect: "answer",
    mustRetrieve: ["tla-s9"],
    reviewNotes: "Licensing authority under s.9; KCCA in Kampala.",
  },
  {
    id: "out-of-scope-eviction",
    question: "Can my landlord evict me without notice?",
    expect: "refuse",
    reviewNotes: "Tenancy law is not in the knowledge base yet.",
  },
  {
    id: "out-of-scope-divorce",
    question: "How do I file for divorce?",
    expect: "refuse",
    reviewNotes: "Outside the knowledge base; refer to legal aid.",
  },
  {
    id: "out-of-scope-land",
    question: "My brother took our late father's land. What can I do?",
    expect: "refuse",
    reviewNotes: "Succession/land; refer to legal aid or Justice Centres.",
  },
  {
    id: "out-of-scope-dismissal",
    question: "Can I dismiss my shop worker without notice?",
    expect: "refuse",
    reviewNotes:
      "Employment law is not yet in the knowledge base; refer to a lawyer or labour officer.",
  },
];

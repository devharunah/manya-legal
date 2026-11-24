import { CHUNKS } from "@/data/kb/chunks";
import { SOURCES } from "@/data/kb/sources";
import type { CaseRecord, EvidenceDocument } from "@/lib/cases/types";
import { enT } from "@/lib/i18n/translate";
import { displayValue, formatDate } from "@/lib/intake/display";
import type { FieldKey, FieldValue, Intake } from "@/lib/intake/fields";
import { outstanding } from "@/lib/intake/progress";
import { templateSummary } from "@/lib/intake/summary";
import { legalAssessment } from "@/lib/resolve/assessment";
import { pathways } from "@/lib/resolve/pathways";

import { chronology } from "./chronology";
import { type Fonts, PdfWriter } from "./pdf-writer";

export const REPORT_TITLE = "COMMERCIAL DISPUTE PREPARATION REPORT";

/** Spec section 10, word for word. */
export const NOTICE =
  "This document is a dispute preparation report generated from information supplied by the user and documents uploaded to MANYA. It is not a legal opinion, court filing, finding of liability or authentication of evidence. All information should be reviewed for accuracy before being shared or relied upon.";

/** PRD 4.8, word for word; kept alongside the notice. */
export const DISCLAIMER = enT("review.disclaimer");

export const PRELIMINARY = enT("resolve.disclaimer");

export interface ReportInput {
  record: CaseRecord;
  intake: Intake;
  documents: EvidenceDocument[];
  version: number;
  preparedAt: Date;
}

const t = enT;
const label = (key: FieldKey) => t(`field.${key}` as Parameters<typeof t>[0]);

/** How a value is known, in the report's own vocabulary. */
export function provenanceLabel(field: FieldValue | undefined, unknown: boolean): string {
  if (!field) return unknown ? "Unknown to the trader" : "Not provided";
  if (field.source === "document") return "Extracted from a document, not verified";
  if (field.source === "verified") return "Independently verified";
  if (field.source === "awaiting") return "Requires review";
  return field.confirmed
    ? "Reported and confirmed by the trader, not independently verified"
    : "Reported by the trader, unverified";
}

function writeField(w: PdfWriter, intake: Intake, key: FieldKey) {
  const field = intake.values[key];
  const unknown = intake.unknown.includes(key);
  w.field(
    label(key),
    field ? displayValue(t, key, field) : unknown ? "Not known" : "Not provided",
    provenanceLabel(field, unknown),
  );
}

const AGREEMENT_DOCS = new Set(["agreement", "transaction_evidence", "communication_evidence"]);

/** The report body, shared by the report itself and the referral package. */
export function writeReport(w: PdfWriter, input: ReportInput) {
  const { record, intake, documents } = input;
  const prepared = formatDate(input.preparedAt.toISOString().slice(0, 10));
  const assessment = legalAssessment(intake);

  w.title(
    REPORT_TITLE,
    `MANYA · ${record.reference} · Version ${input.version} · Generated ${prepared}`,
  );
  w.paragraph(
    "A dispute preparation document. It draws on the elements of Form 2 (Content of Mediation Summary) of the Judicature (Court Annexed Mediation) Rules, 2026 (S.I. No. 14 of 2026) where appropriate. It is not an official court form, pleading or prescribed ADR document.",
    { muted: true, size: 9 },
  );

  w.heading("1. Case overview");
  w.field("Case reference", record.reference);
  w.field("Date generated", prepared);
  w.field(
    "Dispute category",
    record.category === "other"
      ? "Other commercial dispute (provisional)"
      : "Supplier non-delivery following payment",
  );
  w.field("Case status", `Report version ${input.version}, confirmed by the trader`);
  w.field("Short factual summary (from the trader's answers)", templateSummary(intake));
  if (intake.narrative) {
    w.field("In the trader's own words", intake.narrative, "Reported by the trader");
    if (intake.narrativeEnglish && intake.narrativeEnglish !== intake.narrative) {
      w.field(
        "English translation (machine translation)",
        intake.narrativeEnglish,
        "Check against the original",
      );
    }
  }

  w.heading("2. Parties involved");
  w.paragraph("Trader", { size: 10 });
  for (const key of [
    "complainant.name",
    "complainant.business_name",
    "complainant.phone",
    "complainant.email",
    "complainant.location",
  ] as const) {
    if (intake.values[key] || key === "complainant.name" || key === "complainant.phone")
      writeField(w, intake, key);
  }
  w.paragraph("Other party", { size: 10 });
  for (const key of [
    "respondent.name",
    "respondent.business_name",
    "respondent.phone",
    "respondent.location",
  ] as const) {
    writeField(w, intake, key);
  }

  w.heading("3. Transaction details");
  writeField(w, intake, "transaction.date");
  w.field("Transaction type", "Supply of goods");
  for (const key of [
    "transaction.amount",
    "transaction.currency",
    "transaction.payment_method",
    "transaction.goods",
  ] as const) {
    writeField(w, intake, key);
  }
  writeField(w, intake, "delivery.expected_date");
  writeField(w, intake, "delivery.status");

  w.heading("4. Agreement and dispute-resolution arrangements");
  for (const key of [
    "transaction.agreement_type",
    "agreement_record",
    "arbitration_agreement",
    "mediation_clause",
    "separate_arbitration_agreement",
  ] as const) {
    writeField(w, intake, key);
  }
  const agreementDocs = documents.filter((d) => AGREEMENT_DOCS.has(d.category));
  w.field(
    "Relevant document references",
    agreementDocs.length ? agreementDocs.map((d) => d.filename).join(", ") : "None uploaded",
    "Clauses in uploaded documents have not been reviewed by MANYA",
  );
  const review: string[] = [];
  if (assessment.toClarify.length)
    review.push(`Unclear: ${assessment.toClarify.map((k) => label(k).toLowerCase()).join("; ")}.`);
  if (assessment.arbitrationWritingConcern) {
    review.push(
      "Arbitration was reported but the deal was verbal; an arbitration agreement must be in writing (Arbitration and Conciliation Act, s.3).",
    );
  }
  if (assessment.arbitration === "identified")
    review.push(
      "Whether the arbitration agreement applies and is enforceable requires legal review.",
    );
  if (assessment.mediationClause === "identified")
    review.push("The terms of the mediation clause require review.");
  w.field(
    "Uncertainty requiring legal review",
    review.length
      ? review.join(" ")
      : "None identified from the trader's answers. A legal professional may still need to review the agreement.",
  );

  w.heading("5. Chronology of events");
  const events = chronology(t, intake, documents);
  if (events.length === 0) w.paragraph("No dated events recorded.", { muted: true });
  else {
    w.table(
      ["Date", "Event", "Source", "Verification"],
      events.map((e) => [
        e.date ? formatDate(e.date) : "Date not known",
        e.text,
        e.source === "document" ? "Uploaded document" : "Reported by the trader",
        "Not independently verified",
      ]),
      [0.18, 0.47, 0.18, 0.17],
    );
  }

  w.heading("6. Supporting evidence register");
  writeDocumentIndex(w, documents, record.reference);

  w.heading("7. Trader's desired outcome");
  writeField(w, intake, "requested_resolution");
  w.paragraph(
    "This is what the trader would like to achieve. It is not a guaranteed or legally established outcome.",
    { muted: true, size: 9 },
  );

  w.heading("8. Outstanding information");
  const missing = outstanding(intake).map((key) =>
    intake.unknown.includes(key)
      ? `${label(key)}: not known to the trader`
      : `${label(key)}: not provided`,
  );
  if (
    intake.values.agreement_record?.value === "yes" &&
    !documents.some((d) => AGREEMENT_DOCS.has(d.category))
  ) {
    missing.push("The agreement, invoice or messages recording the deal have not been uploaded");
  }
  if (documents.some((d) => !d.userConfirmed))
    missing.push("Some details read from uploaded documents have not been confirmed by the trader");
  missing.push("The other party's registered business identity has not been established");
  for (const line of missing) w.bullet(line);

  w.heading("9. Potential resolution pathways");
  w.paragraph(
    "Possible routes identified by MANYA's reviewed rules from the information above. They are not ranked and are not legal advice.",
    { muted: true, size: 9 },
  );
  for (const p of pathways(intake, assessment)) {
    w.paragraph(t(`pathway.${p.type}.title` as Parameters<typeof t>[0]), { size: 10.5 });
    w.field(
      "Why it may be relevant",
      p.why.map((l) => t(l.key, l.n === undefined ? undefined : { n: l.n })).join(" "),
    );
    w.field("What needs to be checked", p.check.map((l) => t(l.key)).join(" "));
    w.field("Possible next step", p.steps.map((l) => t(l.key)).join(" "));
    const sources = p.chunkIds.flatMap((id) => {
      const chunk = CHUNKS.find((c) => c.id === id);
      const source = chunk && SOURCES.find((s) => s.id === chunk.sourceId);
      return chunk && source ? [`${source.shortTitle}, ${chunk.locator}`] : [];
    });
    w.field(
      "Relevant legal source",
      sources.length
        ? sources.join("; ")
        : "The parties' own agreement (no reviewed legal source in MANYA)",
    );
  }

  w.heading("10. Important notice");
  w.paragraph(NOTICE, { size: 9.5 });
  w.paragraph(PRELIMINARY, { size: 9 });
  w.paragraph(DISCLAIMER, { size: 9 });
}

export function writeDocumentIndex(w: PdfWriter, documents: EvidenceDocument[], reference = "") {
  if (documents.length === 0) {
    w.paragraph("No supporting documents uploaded.", { muted: true });
    return;
  }
  w.table(
    ["Document", "Category", "Relevant information extracted", "Case association"],
    documents.map((d, i) => {
      const e = d.extraction;
      const read = e
        ? [
            e.documentType,
            e.date ? formatDate(e.date) : null,
            e.amount !== null
              ? `${e.currency ?? ""} ${e.amount.toLocaleString("en-US")}`.trim()
              : null,
            e.reference ? `ref ${e.reference}` : null,
            e.recipient ? `to ${e.recipient}` : null,
          ]
            .filter(Boolean)
            .join("; ")
        : "Not read";
      return [
        `D${i + 1}. ${d.filename}`,
        t(`category.${d.category}` as Parameters<typeof t>[0]),
        `${read || "Nothing extracted"}. ${d.userConfirmed ? "Confirmed by the trader." : "Not yet confirmed by the trader."} Authenticity not verified.`,
        `${reference || "This case"}. Original stored unchanged, SHA-256 ${d.sha256.slice(0, 12)}…`,
      ];
    }),
    [0.24, 0.16, 0.36, 0.24],
  );
}

export async function buildReportPdf(fonts: Fonts, input: ReportInput): Promise<Uint8Array> {
  const w = await PdfWriter.create(
    fonts,
    `MANYA · ${input.record.reference} · Not a legal opinion or court filing`,
  );
  w.doc.setTitle(`${REPORT_TITLE} ${input.record.reference}`);
  w.doc.setProducer("MANYA");
  writeReport(w, input);
  return w.save();
}

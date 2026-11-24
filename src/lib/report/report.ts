import type { CaseRecord, EvidenceDocument } from "@/lib/cases/types";
import { enT } from "@/lib/i18n/translate";
import { displayValue, formatDate } from "@/lib/intake/display";
import type { FieldKey, Intake } from "@/lib/intake/fields";
import { outstanding } from "@/lib/intake/progress";

import { chronology } from "./chronology";
import { type Fonts, PdfWriter } from "./pdf-writer";

export const REPORT_TITLE = "MANYA – Dispute Intake & Mediation Preparation Report";

/** PRD 4.8, word for word. */
export const DISCLAIMER = enT("review.disclaimer");

export interface ReportInput {
  record: CaseRecord;
  intake: Intake;
  documents: EvidenceDocument[];
  version: number;
  preparedAt: Date;
}

const t = enT;

function writeField(w: PdfWriter, intake: Intake, key: FieldKey) {
  const label = t(`field.${key}` as Parameters<typeof t>[0]);
  const field = intake.values[key];
  if (field) {
    w.field(label, displayValue(t, key, field), t(`provenance.${field.source}`));
  } else if (intake.unknown.includes(key)) {
    w.field(label, "Not known to the complainant", "Awaiting confirmation");
  } else {
    w.field(label, "Not provided", "Outstanding");
  }
}

/** The report body, shared by the report itself and the referral package. */
export function writeReport(w: PdfWriter, input: ReportInput) {
  const { record, intake, documents } = input;
  const prepared = formatDate(input.preparedAt.toISOString().slice(0, 10));

  w.title(REPORT_TITLE, `${record.reference} · Version ${input.version} · Prepared ${prepared}`);
  w.paragraph(
    "A dispute preparation document drawing on the information typically requested for mediation. It is not an official court form or a prescribed ADR document.",
    { muted: true, size: 9 },
  );

  w.heading("1. Case identification");
  w.field("Case reference", record.reference);
  w.field(
    "Dispute category",
    record.category === "other"
      ? "Other commercial dispute"
      : "Supplier non-delivery following payment",
  );
  w.field(
    "Language of intake",
    record.language === "lug" ? "Luganda (with English translation)" : "English",
  );
  w.field("Report version", `${input.version}, confirmed by the complainant on ${prepared}`);

  w.heading("2. Complainant information");
  for (const key of [
    "complainant.name",
    "complainant.business_name",
    "complainant.phone",
  ] as const) {
    writeField(w, intake, key);
  }

  w.heading("3. Respondent information");
  writeField(w, intake, "respondent.name");
  writeField(w, intake, "respondent.phone");

  w.heading("4. Background of the commercial relationship");
  writeField(w, intake, "transaction.agreement_type");
  writeField(w, intake, "arbitration_agreement");

  w.heading("5. Description of the dispute");
  if (intake.narrative) {
    w.field("In the complainant's own words", intake.narrative, t("provenance.complainant"));
    if (intake.narrativeEnglish && intake.narrativeEnglish !== intake.narrative) {
      w.field(
        "English translation (machine translation, Sunbird AI)",
        intake.narrativeEnglish,
        "Check against the original",
      );
    }
  }
  writeField(w, intake, "delivery.status");

  w.heading("6. Transaction details");
  for (const key of [
    "transaction.date",
    "transaction.amount",
    "transaction.currency",
    "transaction.goods",
    "delivery.expected_date",
  ] as const) {
    writeField(w, intake, key);
  }

  w.heading("7. Chronology of events");
  const events = chronology(t, intake, documents);
  if (events.length === 0) w.paragraph("No dated events recorded.", { muted: true });
  for (const e of events) {
    const when = e.date ? formatDate(e.date) : "Date not known";
    const from = e.source === "document" ? "from a document" : "supplied by complainant";
    w.bullet(`${when}: ${e.text} (${from})`);
  }

  w.heading("8. Previous resolution attempts");
  writeField(w, intake, "previous_communication");

  w.heading("9. Requested outcome");
  writeField(w, intake, "requested_resolution");

  w.heading("10. Supporting documents");
  writeDocumentIndex(w, documents);

  w.heading("11. Outstanding information");
  const missing = outstanding(intake);
  if (missing.length === 0) w.paragraph("None.", { muted: true });
  for (const key of missing) {
    const label = t(`field.${key}` as Parameters<typeof t>[0]);
    w.bullet(intake.unknown.includes(key) ? `${label}: not known to the complainant` : label);
  }

  w.heading("12. Report preparation declaration");
  w.paragraph(
    `The complainant reviewed the information in this report through MANYA and confirmed it as accurate to the best of their knowledge on ${prepared}.`,
  );
  w.paragraph(
    "Sources of information are labelled on each item: supplied by the complainant, extracted from a document, independently verified, or awaiting confirmation. No item in this report has been independently verified. Uploaded documents were stored unchanged and fingerprinted; their authenticity has not been verified.",
    { muted: true, size: 9 },
  );
  w.paragraph(DISCLAIMER, { size: 9.5 });
}

export function writeDocumentIndex(w: PdfWriter, documents: EvidenceDocument[]) {
  if (documents.length === 0) {
    w.paragraph("No supporting documents uploaded.", { muted: true });
    return;
  }
  documents.forEach((d, i) => {
    const category = t(`category.${d.category}` as Parameters<typeof t>[0]);
    const read = d.extraction
      ? [
          d.extraction.date ? formatDate(d.extraction.date) : null,
          d.extraction.amount !== null
            ? `${d.extraction.currency ?? ""} ${d.extraction.amount.toLocaleString("en-US")}`.trim()
            : null,
          d.extraction.reference ? `ref ${d.extraction.reference}` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : "";
    w.bullet(
      `D${i + 1}. ${d.filename}: ${category}${read ? ` (${read})` : ""}. ${
        d.userConfirmed ? "Details confirmed by complainant" : "Details not yet confirmed"
      }. Authenticity not verified. SHA-256 ${d.sha256.slice(0, 16)}…`,
    );
  });
}

export async function buildReportPdf(fonts: Fonts, input: ReportInput): Promise<Uint8Array> {
  const w = await PdfWriter.create(fonts, `${input.record.reference} · Not a legal determination`);
  w.doc.setTitle(`${REPORT_TITLE} ${input.record.reference}`);
  w.doc.setProducer("MANYA");
  writeReport(w, input);
  return w.save();
}

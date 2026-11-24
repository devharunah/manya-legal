import type { Provider } from "@/data/providers";
import type { CaseRecord, EvidenceDocument, ShareSelection } from "@/lib/cases/types";
import { enT } from "@/lib/i18n/translate";
import { formatDate } from "@/lib/intake/display";
import type { Intake } from "@/lib/intake/fields";
import { chronology } from "@/lib/report/chronology";
import { type Fonts, PdfWriter } from "@/lib/report/pdf-writer";
import { writeDocumentIndex, writeReport } from "@/lib/report/report";

export interface PackageInput {
  record: CaseRecord;
  /** The intake as confirmed in the latest report. */
  intake: Intake;
  reportVersion: number;
  provider: Provider;
  pathway: string;
  shared: ShareSelection;
  consentText: string;
  /** All case documents; only those in `shared.documentIds` are included. */
  documents: EvidenceDocument[];
  /** Original bytes of the selected documents, by id. */
  files: Map<string, Uint8Array>;
  preparedAt: Date;
}

/** Contact details stay out unless the trader chose to share them (PRD 6.6). */
export function withoutContact(intake: Intake): Intake {
  const values = Object.fromEntries(
    Object.entries(intake.values).filter(([key]) => key !== "complainant.phone"),
  ) as Intake["values"];
  return { ...intake, values };
}

/**
 * The referral package (PRD 6.6): exactly what the trader selected, with a
 * cover page recording their consent. Built for the trader to download and
 * share themselves; MANYA never sends it.
 */
export async function buildReferralPackage(fonts: Fonts, input: PackageInput): Promise<Uint8Array> {
  const { record, shared, provider } = input;
  const prepared = formatDate(input.preparedAt.toISOString().slice(0, 10));
  const w = await PdfWriter.create(
    fonts,
    `${record.reference} · Referral package · Shared by the complainant`,
  );
  w.doc.setTitle(`MANYA referral package ${record.reference}`);

  w.title("MANYA – Referral Package", `${record.reference} · Prepared ${prepared}`);
  w.field("Prepared for", provider.name);
  w.field("Pathway the complainant is exploring", input.pathway);
  w.field("Consent", input.consentText);
  w.heading("Contents");
  const selectedDocs = input.documents.filter((d) => shared.documentIds.includes(d.id));
  const contents = [
    shared.report ? `Dispute intake report (version ${input.reportVersion})` : null,
    shared.documentIndex ? "Supporting document index" : null,
    shared.chronology ? "Chronology of events" : null,
    shared.contact
      ? "Complainant contact details (in the report)"
      : "Contact details withheld by the complainant",
    ...selectedDocs.map((d) => `Evidence: ${d.filename}`),
  ].filter((s): s is string => s !== null);
  for (const line of contents) w.bullet(line);
  w.paragraph(
    "This package contains only what the complainant chose to share. MANYA did not send it; the complainant shared it directly. It is a dispute preparation document, not a legal determination, certified statement or finding of liability.",
    { muted: true, size: 9 },
  );

  const intake = shared.contact ? input.intake : withoutContact(input.intake);
  const caseDocs = shared.documentIndex ? input.documents : selectedDocs;
  if (shared.report) {
    w.newPage();
    writeReport(w, {
      record,
      intake,
      documents: caseDocs,
      version: input.reportVersion,
      preparedAt: input.preparedAt,
    });
  }
  if (shared.documentIndex && !shared.report) {
    w.heading("Supporting document index");
    writeDocumentIndex(w, input.documents);
  }
  if (shared.chronology && !shared.report) {
    w.heading("Chronology of events");
    for (const e of chronology(enT, intake, caseDocs)) {
      w.bullet(`${e.date ? formatDate(e.date) : "Date not known"}: ${e.text}`);
    }
  }

  for (const doc of selectedDocs) {
    const bytes = input.files.get(doc.id);
    if (!bytes) continue;
    const caption = `Evidence: ${doc.filename} · SHA-256 ${doc.sha256} · Original as uploaded; authenticity not verified`;
    if (doc.mimeType === "application/pdf") {
      w.heading(caption);
      await w.appendPdf(bytes);
    } else {
      await w.appendImage(bytes, doc.mimeType, caption);
    }
  }
  return w.save();
}

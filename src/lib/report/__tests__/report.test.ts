/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PDFDocument } from "pdf-lib";

import type { CaseRecord } from "@/lib/cases/types";
import { enT } from "@/lib/i18n/translate";
import { emptyIntake } from "@/lib/intake/fields";
import { editField, markUnknown } from "@/lib/intake/merge";

import { chronology } from "../chronology";
import { PdfWriter } from "../pdf-writer";
import { DISCLAIMER, NOTICE, REPORT_TITLE, buildReportPdf, writeReport } from "../report";

const fonts = {
  regular: new Uint8Array(
    readFileSync(join(process.cwd(), "src/assets/fonts/NotoSans-Regular.ttf")),
  ),
  bold: new Uint8Array(readFileSync(join(process.cwd(), "src/assets/fonts/NotoSans-Bold.ttf"))),
};

let intake = emptyIntake();
intake = editField(intake, "complainant.name", "Nakato Sarah");
intake = editField(intake, "transaction.amount", "2000000");
intake = editField(intake, "transaction.currency", "UGX");
intake = editField(intake, "transaction.date", "2026-11-10");
intake = markUnknown(intake, "respondent.phone");
intake = { ...intake, narrative: "Nasasula omusuubuzi, naye ebyamaguzi tebinnaleetebwa — ŋŋ." };

const record: CaseRecord = {
  id: "c1",
  reference: "MNY-0001",
  status: "awaiting_user_confirmation",
  category: "supplier_non_delivery",
  language: "lug",
  intake,
  createdAt: "2026-11-24T00:00:00Z",
  updatedAt: "2026-11-24T00:00:00Z",
};

describe("dispute report PDF", () => {
  it("builds a valid PDF, including Luganda letters", async () => {
    const bytes = await buildReportPdf(fonts, {
      record,
      intake,
      documents: [],
      version: 1,
      preparedAt: new Date(),
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(doc.getTitle()).toContain("MNY-0001");
  }, 30_000);

  it("writes every PRD section, the disclaimer, and marks gaps instead of filling them", async () => {
    const w = await PdfWriter.create(fonts, "test");
    const written: string[] = [];
    for (const m of ["title", "heading", "paragraph", "field", "bullet"] as const) {
      const original = w[m].bind(w) as (...a: string[]) => void;
      (w as unknown as Record<string, (...a: string[]) => void>)[m] = (...args: string[]) => {
        written.push(args.filter((a) => typeof a === "string").join(" | "));
        original(...args);
      };
    }
    writeReport(w, {
      record,
      intake,
      documents: [],
      version: 1,
      preparedAt: new Date("2026-11-24"),
    });
    const text = written.join("\n");
    expect(text).toContain(REPORT_TITLE);
    for (const heading of [
      "1. Case overview",
      "2. Parties involved",
      "3. Transaction details",
      "4. Agreement and dispute-resolution arrangements",
      "5. Chronology of events",
      "6. Supporting evidence register",
      "7. Trader's desired outcome",
      "8. Outstanding information",
      "9. Potential resolution pathways",
      "10. Important notice",
    ]) {
      expect(text).toContain(heading);
    }
    expect(text).toContain(NOTICE);
    expect(text).toContain(DISCLAIMER);
    expect(text).toContain("2,000,000");
    // Gaps are marked, never filled; reported facts are labelled as unverified.
    expect(text).toContain("Supplier (respondent) | Not provided | Not provided");
    expect(text).toContain("Supplier phone | Not known | Unknown to the trader");
    expect(text).toContain("Reported and confirmed by the trader, not independently verified");
    // Unknown clauses are flagged for review, and the pathways section cites sources.
    expect(text).toContain("Uncertainty requiring legal review | Unclear:");
    expect(text).toContain("Relevant legal source | Small Claims Procedure Rules, Rule 5");
  });
});

describe("chronology", () => {
  it("orders dated events and puts undated ones last", () => {
    const events = chronology(enT, intake, [
      {
        id: "d1",
        caseId: "c1",
        repository: "case_workspace",
        storagePath: "u/c1/d1",
        filename: "receipt.jpg",
        mimeType: "image/jpeg",
        size: 1,
        sha256: "abc",
        category: "payment_evidence",
        extraction: null,
        confidence: null,
        verification: {
          fileIntegrity: "passed",
          informationExtraction: "failed",
          sourceAuthenticity: "not_verified",
        },
        userConfirmed: false,
        notes: "",
        uploadedAt: "2026-11-24T00:00:00Z",
      },
    ]);
    expect(events.map((e) => e.date)).toEqual(["2026-11-10", null]);
  });
});

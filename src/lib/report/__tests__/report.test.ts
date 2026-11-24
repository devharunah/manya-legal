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
import { DISCLAIMER, buildReportPdf, writeReport } from "../report";

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
  });

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
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      expect(text).toMatch(new RegExp(`^${n}\\. `, "m"));
    expect(text).toContain(DISCLAIMER);
    expect(text).toContain("2,000,000");
    expect(text).toContain("Supplier (respondent) | Not provided | Outstanding");
    expect(text).toContain("Supplier phone | Not known to the complainant");
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

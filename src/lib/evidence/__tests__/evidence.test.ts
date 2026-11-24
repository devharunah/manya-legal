/** @jest-environment node */
import type { EvidenceDocument } from "@/lib/cases/types";
import { emptyIntake } from "@/lib/intake/fields";
import { editField } from "@/lib/intake/merge";

import { checkConsistency, namesOverlap } from "../consistency";
import { readFromFilename } from "../filename";
import { MAX_UPLOAD_BYTES, checkUpload, safeFilename, sha256Hex, sniff } from "../upload";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

describe("upload checks", () => {
  it("recognises PDF, PNG and JPEG by their bytes", () => {
    expect(sniff(PDF)).toBe("application/pdf");
    expect(sniff(PNG)).toBe("image/png");
    expect(sniff(JPG)).toBe("image/jpeg");
    expect(sniff(new TextEncoder().encode("<script>"))).toBeNull();
  });

  it("rejects empty, oversized, unsupported and disguised files", () => {
    expect(checkUpload(new Uint8Array(), "image/png")).toEqual({ ok: false, reason: "empty" });
    expect(checkUpload(new Uint8Array(MAX_UPLOAD_BYTES + 1), "image/png")).toMatchObject({
      reason: "too_large",
    });
    expect(checkUpload(new TextEncoder().encode("MZ executable"), "application/pdf")).toMatchObject(
      {
        reason: "unsupported",
      },
    );
    expect(checkUpload(PDF, "image/png")).toMatchObject({ reason: "mismatch" });
    expect(checkUpload(JPG, "image/jpg")).toEqual({ ok: true, mime: "image/jpeg" });
  });

  it("cleans file names and fingerprints the bytes", async () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("receipt <1>.png")).toBe("receipt _1_.png");
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

const doc = (over: Partial<EvidenceDocument>): EvidenceDocument => ({
  id: "d1",
  caseId: "c1",
  repository: "case_workspace",
  storagePath: "u/c1/d1",
  filename: "receipt.png",
  mimeType: "image/png",
  size: 10,
  sha256: "x",
  category: "payment_evidence",
  extraction: {
    documentType: "Mobile Money receipt",
    date: "2026-11-10",
    amount: 1_500_000,
    currency: "UGX",
    reference: "XXXX123",
    sender: "Nakato Sarah",
    recipient: "KATO JOHN",
    description: null,
  },
  confidence: 0.9,
  verification: {
    fileIntegrity: "passed",
    informationExtraction: "completed",
    sourceAuthenticity: "not_verified",
  },
  userConfirmed: false,
  notes: "",
  uploadedAt: "2026-11-24T00:00:00Z",
  ...over,
});

let intake = emptyIntake();
intake = editField(intake, "transaction.amount", "2000000");
intake = editField(intake, "transaction.currency", "UGX");
intake = editField(intake, "transaction.date", "2026-11-10");
intake = editField(intake, "respondent.name", "Kato Wholesalers");

describe("consistency checks (PRD 5.8)", () => {
  it("flags the PRD example: report 2,000,000, receipt 1,500,000", () => {
    const flags = checkConsistency(intake, [doc({})]);
    expect(flags).toEqual([
      { documentId: "d1", kind: "amount", reportValue: "2,000,000", documentValue: "1,500,000" },
    ]);
  });

  it("flags a different date or an unrelated recipient", () => {
    const flags = checkConsistency(intake, [
      doc({
        extraction: {
          ...(doc({}).extraction as NonNullable<EvidenceDocument["extraction"]>),
          amount: 2_000_000,
          date: "2026-11-12",
          recipient: "Okello Supplies",
        },
      }),
    ]);
    expect(flags.map((f) => f.kind)).toEqual(["date", "respondent"]);
  });

  it("ignores documents that aren't payment records", () => {
    expect(checkConsistency(intake, [doc({ category: "communication_evidence" })])).toEqual([]);
  });

  it("never changes the report", () => {
    const before = JSON.stringify(intake);
    checkConsistency(intake, [doc({})]);
    expect(JSON.stringify(intake)).toBe(before);
  });

  it("matches names by a shared word", () => {
    expect(namesOverlap("Kato Wholesalers", "KATO JOHN")).toBe(true);
    expect(namesOverlap("Kato Wholesalers Ltd", "Okello Supplies Ltd")).toBe(false);
  });
});

describe("file-name reading (tests and no-AI fallback)", () => {
  it("reads the e2e receipt name", () => {
    const r = readFromFilename("momo-receipt-1500000-2026-11-10.png");
    expect(r.category).toBe("payment_evidence");
    expect(r.extraction).toMatchObject({ amount: 1_500_000, currency: "UGX", date: "2026-11-10" });
  });

  it("says unknown when it can't tell", () => {
    expect(readFromFilename("IMG_0001.jpg")).toMatchObject({ category: "unknown", confidence: 0 });
  });
});

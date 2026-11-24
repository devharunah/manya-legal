/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PDFDocument } from "pdf-lib";

import { CHUNKS } from "@/data/kb/chunks";
import { SOURCES } from "@/data/kb/sources";
import { PROVIDERS } from "@/data/providers";
import type { CaseRecord } from "@/lib/cases/types";
import { en } from "@/lib/i18n/en";
import { type Intake, emptyIntake } from "@/lib/intake/fields";
import { editField } from "@/lib/intake/merge";

import { buildReferralPackage, withoutContact } from "../package";
import {
  SMALL_CLAIMS_LIMIT_CHUNK,
  SMALL_CLAIMS_LIMIT_UGX,
  knownChunk,
  pathways,
} from "../pathways";

const base = (edits: Record<string, string>): Intake =>
  Object.entries(edits).reduce((i, [k, v]) => editField(i, k as never, v), emptyIntake());

const types = (i: Intake) => pathways(i).map((p) => p.type);
const smallClaims = (i: Intake) => pathways(i).find((p) => p.type === "small_claims");

describe("knowledge base integrity", () => {
  it("every chunk points at a known source, and every source has a URL and access date", () => {
    for (const c of CHUNKS) expect(SOURCES.some((s) => s.id === c.sourceId)).toBe(true);
    for (const s of SOURCES) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("the small claims limit constant matches the cited rule text", () => {
    const chunk = CHUNKS.find((c) => c.id === SMALL_CLAIMS_LIMIT_CHUNK);
    expect(chunk?.text).toContain("does not exceed ten million Uganda shillings");
    expect(SMALL_CLAIMS_LIMIT_UGX).toBe(10_000_000);
  });

  it("only providers checked against their own source are shown as verified", () => {
    for (const p of PROVIDERS.filter((x) => x.status === "verified")) {
      expect(p.verificationSource).not.toMatch(/summaris/i);
    }
  });
});

describe("pathways (PRD 6.2/6.3)", () => {
  it("cites only chunks that exist and providers that exist, with an explanation for every line", () => {
    const all = pathways(base({ "transaction.amount": "2000000", arbitration_agreement: "yes" }));
    for (const p of all) {
      for (const id of p.chunkIds) expect(knownChunk(id)).toBe(true);
      for (const id of p.providerIds) expect(PROVIDERS.some((x) => x.id === id)).toBe(true);
      for (const line of [...p.why, ...p.steps]) expect(line.key in en).toBe(true);
    }
  });

  it("never suggests arbitration without an arbitration agreement", () => {
    expect(types(base({}))).not.toContain("arbitration");
    expect(types(base({ arbitration_agreement: "unsure" }))).not.toContain("arbitration");
    expect(types(base({ arbitration_agreement: "yes" }))).toContain("arbitration");
  });

  it("warns when the arbitration agreement may not be in writing", () => {
    const arb = pathways(
      base({ arbitration_agreement: "yes", "transaction.agreement_type": "verbal" }),
    ).find((p) => p.type === "arbitration");
    expect(arb?.why.map((l) => l.key)).toContain("pathway.arbitration.verbal");
  });

  it("presents small claims cautiously at, over and without the limit", () => {
    const at = smallClaims(
      base({ "transaction.amount": "10000000", "transaction.currency": "UGX" }),
    );
    expect(at?.status).toBe("requires_further_assessment");
    expect(at?.why[0]).toEqual({ key: "pathway.small_claims.within", n: "UGX 10,000,000" });
    expect(at?.why.map((l) => l.key)).toContain("pathway.small_claims.conditions");

    const over = smallClaims(
      base({ "transaction.amount": "10000001", "transaction.currency": "UGX" }),
    );
    expect(over?.why[0]?.key).toBe("pathway.small_claims.over");

    expect(smallClaims(base({}))?.why[0]?.key).toBe("pathway.small_claims.whyUnknownAmount");
    expect(
      smallClaims(base({ "transaction.amount": "500", "transaction.currency": "USD" }))?.why[0],
    ).toEqual({
      key: "pathway.small_claims.whyCurrency",
      n: "USD",
    });
  });

  it("notes that small claims don't cover a claim for delivery alone", () => {
    const sc = smallClaims(
      base({ "transaction.amount": "2000000", requested_resolution: "delivery" }),
    );
    expect(sc?.why.map((l) => l.key)).toContain("pathway.small_claims.delivery");
  });
});

describe("referral package (PRD 6.6)", () => {
  const fonts = {
    regular: new Uint8Array(
      readFileSync(join(process.cwd(), "src/assets/fonts/NotoSans-Regular.ttf")),
    ),
    bold: new Uint8Array(readFileSync(join(process.cwd(), "src/assets/fonts/NotoSans-Bold.ttf"))),
  };
  const intake = base({ "complainant.phone": "0772123456", "transaction.amount": "2000000" });
  const record: CaseRecord = {
    id: "c1",
    reference: "MNY-0001",
    status: "report_generated",
    category: "supplier_non_delivery",
    language: "en",
    intake,
    createdAt: "2026-11-24T00:00:00Z",
    updatedAt: "2026-11-24T00:00:00Z",
  };

  it("withholds contact details unless shared", () => {
    expect(withoutContact(intake).values["complainant.phone"]).toBeUndefined();
    expect(withoutContact(intake).values["transaction.amount"]?.value).toBe(2_000_000);
  });

  it("builds a PDF with only the selected parts", async () => {
    const provider = PROVIDERS[0];
    if (!provider) throw new Error("no providers");
    const bytes = await buildReferralPackage(fonts, {
      record,
      intake,
      reportVersion: 1,
      provider,
      pathway: "Mediation",
      shared: {
        report: false,
        documentIndex: true,
        chronology: true,
        contact: false,
        documentIds: [],
      },
      consentText: "I consent.",
      documents: [],
      files: new Map(),
      preparedAt: new Date(),
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toContain("MNY-0001");
  });
});

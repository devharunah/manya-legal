import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CaseRecord, CaseStore, EvidenceDocument } from "@/lib/cases/types";
import { sha256Hex } from "@/lib/evidence/upload";
import { type FieldKey, type Intake, emptyIntake } from "@/lib/intake/fields";
import { encodeFields } from "@/lib/intake/progress";
import { loadFonts } from "@/lib/report/fonts";
import { buildReportPdf } from "@/lib/report/report";

import { DEMO_CASES, DEMO_PROFILE, type DemoCase } from "./cases";

const DIR = join(process.cwd(), "public", "demo");

function intakeOf(demo: DemoCase, confirmed: boolean): Intake {
  const values: Intake["values"] = {};
  for (const [key, value] of Object.entries(demo.values) as [FieldKey, string | number][]) {
    values[key] = { value, source: "complainant", confirmed };
  }
  const asked: NonNullable<Intake["workflow"]>["asked"] = {};
  for (const turn of demo.turns)
    if ("ask" in turn) asked[turn.stage] = (asked[turn.stage] ?? 0) + 1;
  return {
    ...emptyIntake(),
    values,
    narrative: demo.narrative,
    events: demo.events,
    workflow: { asked, rounds: demo.turns.filter((t) => "trader" in t).length },
  };
}

async function seedCase(store: CaseStore, demo: DemoCase): Promise<CaseRecord> {
  const created = await store.createCase("en");
  const id = created.id;
  await store.audit({ action: "case.create", resourceType: "case", resourceId: id, caseId: id });

  for (const turn of demo.turns) {
    await store.addMessage(
      "trader" in turn
        ? {
            caseId: id,
            sender: "trader",
            originalText: turn.trader,
            processedText: null,
            language: "en",
            inputType: "text",
            field: null,
          }
        : "ask" in turn
          ? {
              caseId: id,
              sender: "manya",
              originalText: turn.ask,
              processedText: null,
              language: "en",
              inputType: "system",
              field: encodeFields(turn.fields),
            }
          : {
              caseId: id,
              sender: "manya",
              originalText: turn.say,
              processedText: null,
              language: "en",
              inputType: "system",
              field: null,
            },
    );
  }

  const documents: EvidenceDocument[] = [];
  for (const d of demo.documents) {
    const bytes = new Uint8Array(await readFile(join(DIR, d.file)));
    const storagePath = `${store.userId}/${id}/${crypto.randomUUID()}-${d.file}`;
    await store.putFile(storagePath, bytes, d.mimeType);
    const added = await store.addDocument({
      caseId: id,
      repository: "case_workspace",
      storagePath,
      filename: d.file,
      mimeType: d.mimeType,
      size: bytes.length,
      sha256: await sha256Hex(bytes),
      category: d.category,
      extraction: d.extraction,
      confidence: 0.95,
      verification: {
        fileIntegrity: "passed",
        informationExtraction: "completed",
        sourceAuthenticity: "not_verified",
      },
      userConfirmed: demo.stage === "report",
      notes: "",
    });
    documents.push(added);
    await store.audit({
      action: "document.upload",
      resourceType: "document",
      resourceId: added.id,
      caseId: id,
    });
  }

  if (demo.stage === "review") {
    return store.updateCase(id, {
      intake: intakeOf(demo, false),
      category: "supplier_non_delivery",
      status: "awaiting_user_confirmation",
    });
  }

  const intake = intakeOf(demo, true);
  const record = await store.updateCase(id, {
    intake,
    category: "supplier_non_delivery",
    status: "awaiting_user_confirmation",
  });
  const preparedAt = new Date();
  const pdf = await buildReportPdf(await loadFonts(), {
    record,
    intake,
    documents,
    version: 1,
    preparedAt,
  });
  const pdfPath = `${store.userId}/${id}/report-v1.pdf`;
  await store.putFile(pdfPath, pdf, "application/pdf");
  const report = await store.addReport({
    caseId: id,
    version: 1,
    intake,
    pdfPath,
    confirmedAt: preparedAt.toISOString(),
  });
  await store.audit({
    action: "report.generate",
    resourceType: "report",
    resourceId: report.id,
    caseId: id,
  });
  return store.updateCase(id, { status: "report_generated" });
}

/**
 * Loads the demo trader and cases into the current session. Safe to run
 * twice: an existing profile is kept, and a demo case already present is
 * not added again.
 */
export async function seedDemo(store: CaseStore): Promise<CaseRecord[]> {
  if (!(await store.getProfile())) await store.saveProfile(DEMO_PROFILE);
  const existing = await store.listCases();
  const has = (key: string) =>
    existing.some((c) => c.intake.values["respondent.name"]?.value === key);
  const created: CaseRecord[] = [];
  // Oldest first, so the flagship case ends up at the top of the list.
  for (const demo of [...DEMO_CASES].reverse()) {
    if (!has(demo.key)) created.push(await seedCase(store, demo));
  }
  return created;
}

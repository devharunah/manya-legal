import { z } from "zod";

import { fail, json, withStore } from "@/lib/api";
import { canMove } from "@/lib/cases/state";
import { confirmAll } from "@/lib/intake/merge";
import { loadFonts } from "@/lib/report/fonts";
import { buildReportPdf } from "@/lib/report/report";

export const maxDuration = 60;

const bodySchema = z.object({ confirmed: z.literal(true) });

/**
 * PRD 4.8: the trader has reviewed and confirmed; build the PDF, store it
 * against the case as a new version, and move the case on.
 */
export const POST = (req: Request, ctx: RouteContext<"/api/cases/[id]/report">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    if (!bodySchema.safeParse(await req.json().catch(() => null)).success) {
      return fail("Confirm that the information is accurate first.", 400);
    }
    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    if (!canMove(record.status, "report_generated")) {
      return fail("Review your report before creating the PDF.", 409);
    }

    const intake = confirmAll(record.intake);
    const [reports, documents] = await Promise.all([
      store.listReports(id),
      store.listDocuments({ caseId: id }),
    ]);
    const version = (reports[0]?.version ?? 0) + 1;
    const preparedAt = new Date();
    const pdf = await buildReportPdf(await loadFonts(), {
      record,
      intake,
      documents,
      version,
      preparedAt,
    });
    const pdfPath = `${store.userId}/${id}/report-v${version}.pdf`;
    await store.putFile(pdfPath, pdf, "application/pdf");
    const report = await store.addReport({
      caseId: id,
      version,
      intake,
      pdfPath,
      confirmedAt: preparedAt.toISOString(),
    });
    const updated = await store.updateCase(id, { intake, status: "report_generated" });
    await store.audit({
      action: "report.generate",
      resourceType: "report",
      resourceId: report.id,
      caseId: id,
    });
    return json({ case: updated, report }, 201);
  });

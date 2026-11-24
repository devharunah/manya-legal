import { fail, withStore } from "@/lib/api";

/**
 * Downloads a stored file the trader owns: a report version, an uploaded
 * original or a referral package. The row is looked up through the trader's
 * own session first, so another trader's file is simply not found.
 */
export const GET = (req: Request) =>
  withStore(async (store) => {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const id = url.searchParams.get("id") ?? "";
    const caseId = url.searchParams.get("case") ?? "";

    let path: string | null = null;
    let filename = "manya.pdf";
    let type = "application/pdf";
    let inline = false;

    if (kind === "report") {
      const report = (await store.listReports(caseId)).find((r) => r.id === id);
      const record = report ? await store.getCase(caseId) : null;
      if (report && record) {
        path = report.pdfPath;
        filename = `${record.reference}-report-v${report.version}.pdf`;
        await store.audit({
          action: "report.download",
          resourceType: "report",
          resourceId: id,
          caseId,
        });
      }
    } else if (kind === "document") {
      const doc = await store.getDocument(id);
      if (doc) {
        path = doc.storagePath;
        filename = doc.filename;
        type = doc.mimeType;
        inline = true;
        await store.audit({
          action: "document.view",
          resourceType: "document",
          resourceId: id,
          caseId: doc.caseId,
        });
      }
    } else if (kind === "referral") {
      const referral = (await store.listReferrals(caseId)).find((r) => r.id === id);
      if (referral) {
        path = referral.packagePath;
        filename = `manya-referral-${referral.providerId}.pdf`;
        await store.audit({
          action: "referral.download",
          resourceType: "referral",
          resourceId: id,
          caseId,
        });
      }
    }

    const bytes = path ? await store.getFile(path) : null;
    if (!bytes) return fail("File not found.", 404);
    const safeName = filename.replace(/[^\w.-]+/g, "_");
    return new Response(new Blob([bytes as BlobPart], { type }), {
      headers: {
        "content-type": type,
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  });

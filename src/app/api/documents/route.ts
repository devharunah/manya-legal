import { fail, json, withStore } from "@/lib/api";
import { readDocument } from "@/lib/evidence/extract";
import { MAX_UPLOAD_BYTES, checkUpload, safeFilename, sha256Hex } from "@/lib/evidence/upload";

export const maxDuration = 60;

const REASONS = {
  empty: "That file is empty.",
  too_large: "That file is larger than 5 MB.",
  unsupported: "Upload a PDF, JPG or PNG.",
  mismatch: "That file isn't what its name says. Upload a PDF, JPG or PNG.",
} as const;

/**
 * PRD 5.4: validate, fingerprint and store the original unchanged, then read
 * it. Goes to a case workspace (`caseId`) or the Business Vault.
 */
export const POST = (req: Request) =>
  withStore(async (store) => {
    if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64_000) {
      return fail(REASONS.too_large, 413);
    }
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const caseId = form?.get("caseId");
    if (!(file instanceof File)) return fail("Choose a file to upload.", 400);
    if (typeof caseId === "string" && caseId && !(await store.getCase(caseId))) {
      return fail("Case not found.", 404);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkUpload(bytes, file.type);
    if (!check.ok) return fail(REASONS[check.reason], check.reason === "too_large" ? 413 : 415);

    const id = crypto.randomUUID();
    const filename = safeFilename(file.name);
    const inCase = typeof caseId === "string" && caseId !== "";
    const storagePath = `${store.userId}/${inCase ? caseId : "vault"}/${id}-${filename}`;
    const sha256 = await sha256Hex(bytes);
    await store.putFile(storagePath, bytes, check.mime);

    const reading = await readDocument(bytes, check.mime, filename);
    const doc = await store.addDocument({
      caseId: inCase ? caseId : null,
      repository: inCase ? "case_workspace" : "business_vault",
      storagePath,
      filename,
      mimeType: check.mime,
      size: bytes.length,
      sha256,
      category: reading.category,
      extraction: reading.extraction,
      confidence: reading.confidence,
      verification: {
        fileIntegrity: "passed",
        informationExtraction: reading.ok ? "completed" : "failed",
        sourceAuthenticity: "not_verified",
      },
      userConfirmed: false,
      notes: "",
    });
    await store.audit({
      action: "document.upload",
      resourceType: "document",
      resourceId: doc.id,
      caseId: doc.caseId,
    });
    return json({ document: doc }, 201);
  });

export const GET = () =>
  withStore(async (store) =>
    json({ documents: await store.listDocuments({ repository: "business_vault" }) }),
  );

import { z } from "zod";

import { fail, json, withStore } from "@/lib/api";
import { DOCUMENT_CATEGORIES } from "@/lib/cases/types";

const text = z.string().trim().max(200).nullable();
const bodySchema = z.object({
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  extraction: z
    .object({
      documentType: text,
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
      amount: z.number().positive().nullable(),
      currency: z.string().trim().toUpperCase().max(3).nullable(),
      reference: text,
      sender: text,
      recipient: text,
      description: z.string().trim().max(500).nullable(),
    })
    .optional(),
  confirm: z.literal(true).optional(),
});

/**
 * PRD 5.6: the trader corrects and confirms what was read. The original file
 * is never touched; only the extracted details change.
 */
export const PATCH = (req: Request, ctx: RouteContext<"/api/documents/[id]">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return fail("Check the details: dates as yyyy-mm-dd, amounts as numbers.", 400);
    if (!(await store.getDocument(id))) return fail("Document not found.", 404);
    const { category, extraction, confirm } = parsed.data;
    const updated = await store.updateDocument(id, {
      ...(category ? { category } : {}),
      ...(extraction ? { extraction } : {}),
      ...(confirm
        ? { userConfirmed: true }
        : extraction || category
          ? { userConfirmed: false }
          : {}),
    });
    await store.audit({
      action: "document.edit",
      resourceType: "document",
      resourceId: id,
      caseId: updated.caseId,
    });
    return json({ document: updated });
  });

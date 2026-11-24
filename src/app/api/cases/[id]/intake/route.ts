import { z } from "zod";

import { fail, json, withStore } from "@/lib/api";
import { type CaseStatus, canMove } from "@/lib/cases/state";
import { FIELD_KEYS, type FieldKey } from "@/lib/intake/fields";
import { editField } from "@/lib/intake/merge";

const bodySchema = z.object({
  edits: z
    .partialRecord(z.enum(FIELD_KEYS as [FieldKey, ...FieldKey[]]), z.string().max(300))
    .default({}),
  action: z.enum(["review", "pause", "resume", "language"]).optional(),
  language: z.enum(["en", "lug"]).optional(),
});

/**
 * Edits from the review screen, and the trader's own workflow choices
 * ("review my report now", pause, resume, language). Every move is checked by state.ts.
 */
export const PATCH = (req: Request, ctx: RouteContext<"/api/cases/[id]/intake">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Those changes couldn't be read.", 400);
    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    if (record.status === "completed") return fail("This case is closed.", 409);

    let intake = record.intake;
    const edits = Object.entries(parsed.data.edits) as [FieldKey, string][];
    for (const [key, value] of edits) intake = editField(intake, key, value);

    let status: CaseStatus = record.status;
    const go = (to: CaseStatus) => {
      if (canMove(status, to)) status = to;
    };
    // Changing a generated report reopens confirmation; the next PDF is a new version.
    if (edits.length > 0 && status === "report_generated") go("awaiting_user_confirmation");
    const action = parsed.data.action;
    if (action === "review") {
      if (status === "draft") go("collecting_information");
      go("awaiting_user_confirmation");
    }
    if (action === "pause") go("paused");
    if (action === "resume") go("collecting_information");

    const updated = await store.updateCase(id, {
      intake,
      status,
      ...(action === "language" && parsed.data.language ? { language: parsed.data.language } : {}),
    });
    return json({ case: updated });
  });

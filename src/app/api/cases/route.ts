import { z } from "zod";

import { fail, json, withStore } from "@/lib/api";
import { prefillFromProfile } from "@/lib/intake/prefill";

export const GET = () => withStore(async (store) => json({ cases: await store.listCases() }));

const bodySchema = z.object({ language: z.enum(["en", "lug"]) });

/** Starts a new dispute, prefilled with what the profile already says about the trader. */
export const POST = (req: Request) =>
  withStore(async (store) => {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Choose a language.", 400);
    const profile = await store.getProfile();
    if (!profile) return fail("Register your business first.", 409);
    const created = await store.createCase(parsed.data.language);
    const record = await store.updateCase(created.id, { intake: prefillFromProfile(created.intake, profile) });
    await store.audit({ action: "case.create", resourceType: "case", resourceId: record.id, caseId: record.id });
    return json({ case: record }, 201);
  });

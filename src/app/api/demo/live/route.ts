import { fail, json } from "@/lib/api";
import { NoStoreError, startSession } from "@/lib/db/session";
import { DEMO_PROFILE } from "@/lib/demo/cases";
import { prefillFromProfile } from "@/lib/intake/prefill";

/**
 * Starts a fresh live-demo case in the visitor's own session: the fictional
 * trader's profile (if none is set) and an empty English case whose prepared
 * answers are read without AI. Each call makes a new case, so rehearsals
 * never get in the way of the real run.
 */
export async function POST() {
  try {
    const store = await startSession();
    let profile = await store.getProfile();
    if (!profile) {
      await store.saveProfile(DEMO_PROFILE);
      profile = DEMO_PROFILE;
    }
    const created = await store.createCase("en");
    const record = await store.updateCase(created.id, {
      intake: { ...prefillFromProfile(created.intake, profile), demo: "live" },
    });
    await store.audit({
      action: "case.create",
      resourceType: "case",
      resourceId: record.id,
      caseId: record.id,
    });
    return json({ id: record.id, profile }, 201);
  } catch (error) {
    if (error instanceof NoStoreError)
      return fail("MANYA storage is not available right now.", 503);
    console.error("[demo/live]", error instanceof Error ? error.message : error);
    return fail("We couldn't start the live demo. Please try again.", 500);
  }
}

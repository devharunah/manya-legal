import { fail, json } from "@/lib/api";
import { NoStoreError, startSession } from "@/lib/db/session";
import { DEMO_PROFILE } from "@/lib/demo/cases";

/**
 * Signs the visitor in as the fictional demo trader for the hackathon login
 * shortcut: saves the demo profile if the session has none, and creates no
 * cases, so the presenter lands on a clean dashboard and starts the live
 * demo from there.
 */
export async function POST() {
  try {
    const store = await startSession();
    const existing = await store.getProfile();
    if (existing) return json({ profile: existing });
    await store.saveProfile(DEMO_PROFILE);
    return json({ profile: DEMO_PROFILE }, 201);
  } catch (error) {
    if (error instanceof NoStoreError)
      return fail("MANYA storage is not available right now.", 503);
    console.error("[demo/profile]", error instanceof Error ? error.message : error);
    return fail("We couldn't open the hackathon demo. Please try again.", 500);
  }
}

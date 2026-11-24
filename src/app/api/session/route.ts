import { fail, json } from "@/lib/api";
import { NoStoreError, endSession, startSession } from "@/lib/db/session";

/** Starts (or resumes) the trader's session and says whether they have registered. */
export async function POST() {
  try {
    const store = await startSession();
    return json({ profile: await store.getProfile() });
  } catch (error) {
    if (error instanceof NoStoreError)
      return fail("MANYA storage is not available right now.", 503);
    console.error("[session]", error instanceof Error ? error.message : error);
    return fail("We couldn't start your session. Please reload the page.", 500);
  }
}

export async function DELETE() {
  await endSession();
  return json({ ok: true });
}

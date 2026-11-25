import { fail, json } from "@/lib/api";
import { NoStoreError, startSession } from "@/lib/db/session";
import { DEMO_CASES } from "@/lib/demo/cases";
import { seedDemo } from "@/lib/demo/seed";

export const maxDuration = 60;

/**
 * Fills the visitor's own session with the stage demo: a fictional trader
 * and two cases with SAMPLE documents. Nothing is shared with other visitors.
 */
export async function POST() {
  try {
    const store = await startSession();
    const created = await seedDemo(store);
    const flagship = (await store.listCases()).find(
      (c) =>
        c.intake.demo !== "live" &&
        c.intake.values["respondent.name"]?.value === DEMO_CASES[0]?.key,
    );
    return json(
      {
        created: created.map((c) => c.id),
        flagship: flagship?.id ?? null,
        profile: await store.getProfile(),
      },
      201,
    );
  } catch (error) {
    if (error instanceof NoStoreError)
      return fail("MANYA storage is not available right now.", 503);
    console.error("[demo]", error instanceof Error ? error.message : error);
    return fail("We couldn't load the demo cases. Please try again.", 500);
  }
}

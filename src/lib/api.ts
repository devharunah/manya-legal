import type { CaseStore } from "@/lib/cases/types";
import { NoStoreError, getStore } from "@/lib/db/session";

export const json = (body: unknown, status = 200) => Response.json(body, { status });
export const fail = (error: string, status: number) => Response.json({ error }, { status });

/**
 * Runs a handler with the signed-in trader's store. Errors are logged with
 * their cause and answered with a message that never leaks internals.
 */
export async function withStore(handler: (store: CaseStore) => Promise<Response>): Promise<Response> {
  try {
    const store = await getStore();
    if (!store) return fail("Your session has ended. Reload the page to continue.", 401);
    return await handler(store);
  } catch (error) {
    if (error instanceof NoStoreError) return fail("MANYA storage is not available right now.", 503);
    console.error("[api]", error instanceof Error ? error.message : error);
    return fail("Something went wrong on our side. Please try again.", 500);
  }
}

import { fail, json, withStore } from "@/lib/api";

/** One case with everything in its workspace. Another trader's case is simply not found. */
export const GET = (_req: Request, ctx: RouteContext<"/api/cases/[id]">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    const [messages, reports, documents, referrals] = await Promise.all([
      store.listMessages(id),
      store.listReports(id),
      store.listDocuments({ caseId: id }),
      store.listReferrals(id),
    ]);
    return json({ case: record, messages, reports, documents, referrals });
  });

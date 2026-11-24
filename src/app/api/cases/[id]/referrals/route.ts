import { z } from "zod";

import { providerById } from "@/data/providers";
import { fail, json, withStore } from "@/lib/api";
import { enT } from "@/lib/i18n/translate";
import { loadFonts } from "@/lib/report/fonts";
import { buildReferralPackage } from "@/lib/resolve/package";

export const maxDuration = 60;

const PATHWAYS = [
  "negotiation",
  "mediation",
  "arbitration",
  "small_claims",
  "legal_referral",
] as const;

const bodySchema = z.object({
  providerId: z.string().min(1).max(60),
  pathway: z.enum(PATHWAYS),
  consent: z.literal(true),
  shared: z.object({
    report: z.boolean(),
    documentIndex: z.boolean(),
    chronology: z.boolean(),
    contact: z.boolean(),
    documentIds: z.array(z.uuid()).max(30),
  }),
});

/**
 * PRD 6.5/6.6: with the trader's explicit consent, build a package of exactly
 * what they selected. It is stored for them to download; nothing is sent.
 */
export const POST = (req: Request, ctx: RouteContext<"/api/cases/[id]/referrals">) =>
  withStore(async (store) => {
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Choose a provider, what to share, and give consent.", 400);
    const { providerId, pathway, shared } = parsed.data;
    const provider = providerById(providerId);
    if (!provider) return fail("Unknown provider.", 400);

    const record = await store.getCase(id);
    if (!record) return fail("Case not found.", 404);
    const [reports, documents] = await Promise.all([
      store.listReports(id),
      store.listDocuments({ caseId: id }),
    ]);
    const report = reports[0];
    if (!report) return fail("Confirm your dispute report first.", 409);

    const chosen = documents.filter((d) => shared.documentIds.includes(d.id));
    if (chosen.length !== shared.documentIds.length)
      return fail("Some documents aren't in this case.", 400);
    const files = new Map<string, Uint8Array>();
    for (const doc of chosen) {
      const bytes = await store.getFile(doc.storagePath);
      if (bytes) files.set(doc.id, bytes);
    }

    const consentText = enT("referral.consent", { n: provider.name });
    const preparedAt = new Date();
    const pdf = await buildReferralPackage(await loadFonts(), {
      record,
      intake: report.intake,
      reportVersion: report.version,
      provider,
      pathway: enT(`pathway.${pathway}.title`),
      shared,
      consentText,
      documents,
      files,
      preparedAt,
    });
    const packagePath = `${store.userId}/${id}/referral-${crypto.randomUUID()}.pdf`;
    await store.putFile(packagePath, pdf, "application/pdf");
    const referral = await store.addReferral({
      caseId: id,
      providerId,
      pathway,
      consentStatus: "given",
      consentText,
      shared,
      packagePath,
    });
    await store.audit({
      action: "referral.consent",
      resourceType: "referral",
      resourceId: referral.id,
      caseId: id,
    });
    return json({ referral }, 201);
  });

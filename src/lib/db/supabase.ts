import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CaseRecord,
  CaseStore,
  EvidenceDocument,
  Message,
  Profile,
  Referral,
  Report,
} from "@/lib/cases/types";
import { type Intake, emptyIntake } from "@/lib/intake/fields";

import { caseReference } from "./reference";

/**
 * Postgres through the trader's own session. Isolation is enforced by the
 * row-level security policies in supabase/migrations, not by these queries.
 */
type Row = Record<string, unknown>;

const BUCKET = "evidence";

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error || result.data === null) {
    throw new Error(`${what}: ${result.error?.message ?? "no data"}`);
  }
  return result.data;
}

const toCase = (r: Row): CaseRecord => ({
  id: r["id"] as string,
  reference: r["case_reference"] as string,
  status: r["status"] as CaseRecord["status"],
  category: (r["dispute_category"] as CaseRecord["category"]) ?? null,
  language: r["language"] as CaseRecord["language"],
  intake: r["intake"] as Intake,
  createdAt: r["created_at"] as string,
  updatedAt: r["updated_at"] as string,
});

const toMessage = (r: Row): Message => ({
  id: r["id"] as string,
  caseId: r["case_id"] as string,
  sender: r["sender"] as Message["sender"],
  originalText: r["original_text"] as string,
  processedText: (r["processed_text"] as string | null) ?? null,
  language: r["language"] as Message["language"],
  inputType: r["input_type"] as Message["inputType"],
  field: (r["field"] as Message["field"]) ?? null,
  createdAt: r["created_at"] as string,
});

const toReport = (r: Row): Report => ({
  id: r["id"] as string,
  caseId: r["case_id"] as string,
  version: r["version"] as number,
  intake: r["structured_data"] as Intake,
  pdfPath: r["pdf_storage_path"] as string,
  confirmedAt: r["confirmed_at"] as string,
  createdAt: r["created_at"] as string,
});

const toDocument = (r: Row): EvidenceDocument => ({
  id: r["id"] as string,
  caseId: (r["case_id"] as string | null) ?? null,
  repository: r["repository_type"] as EvidenceDocument["repository"],
  storagePath: r["storage_path"] as string,
  filename: r["original_filename"] as string,
  mimeType: r["mime_type"] as string,
  size: r["size_bytes"] as number,
  sha256: r["file_hash"] as string,
  category: r["document_category"] as EvidenceDocument["category"],
  extraction: (r["extracted_metadata"] as EvidenceDocument["extraction"]) ?? null,
  confidence: (r["extraction_confidence"] as number | null) ?? null,
  verification: r["verification"] as EvidenceDocument["verification"],
  userConfirmed: r["user_confirmed"] as boolean,
  notes: r["notes"] as string,
  uploadedAt: r["uploaded_at"] as string,
});

const toReferral = (r: Row): Referral => ({
  id: r["id"] as string,
  caseId: r["case_id"] as string,
  providerId: r["provider_id"] as string,
  pathway: r["recommended_pathway"] as string,
  consentStatus: "given",
  consentText: r["consent_text"] as string,
  shared: r["shared_information"] as Referral["shared"],
  packagePath: r["package_storage_path"] as string,
  createdAt: r["created_at"] as string,
});

/** Listing columns kept in step with the intake JSON (PRD 9.3). */
function listingColumns(intake: Intake): Row {
  const v = intake.values;
  return {
    transaction_amount: v["transaction.amount"]?.value ?? null,
    currency: v["transaction.currency"]?.value ?? null,
    respondent_name: v["respondent.name"]?.value ?? null,
    requested_resolution: v["requested_resolution"]?.value ?? null,
  };
}

export function createSupabaseStore(sb: SupabaseClient, userId: string): CaseStore {
  return {
    userId,

    async getProfile() {
      const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw new Error(`profile: ${error.message}`);
      if (!data) return null;
      const r = data as Row;
      return {
        fullName: r["full_name"] as string,
        phone: r["phone"] as string,
        preferredLanguage: r["preferred_language"] as Profile["preferredLanguage"],
        businessName: r["business_name"] as string,
        businessType: r["business_type"] as string,
        location: r["location"] as string,
      };
    },
    async saveProfile(p) {
      const { error } = await sb.from("profiles").upsert({
        id: userId,
        full_name: p.fullName,
        phone: p.phone,
        preferred_language: p.preferredLanguage,
        business_name: p.businessName,
        business_type: p.businessType,
        location: p.location,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(`save profile: ${error.message}`);
    },

    async listCases() {
      const rows = must(
        await sb.from("cases").select("*").order("updated_at", { ascending: false }),
        "list cases",
      );
      return (rows as unknown as Row[]).map(toCase);
    },
    async createCase(language) {
      const { count } = await sb.from("cases").select("id", { count: "exact", head: true });
      const intake = emptyIntake();
      const row = must(
        await sb
          .from("cases")
          .insert({
            case_reference: caseReference((count ?? 0) + 1),
            language,
            intake,
            ...listingColumns(intake),
          })
          .select()
          .single(),
        "create case",
      );
      return toCase(row as unknown as Row);
    },
    async getCase(id) {
      const { data, error } = await sb.from("cases").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`get case: ${error.message}`);
      return data ? toCase(data as Row) : null;
    },
    async updateCase(id, patch) {
      const update: Row = { updated_at: new Date().toISOString() };
      if (patch.status) update["status"] = patch.status;
      if (patch.category !== undefined) update["dispute_category"] = patch.category;
      if (patch.language) update["language"] = patch.language;
      if (patch.intake)
        Object.assign(update, { intake: patch.intake }, listingColumns(patch.intake));
      const row = must(
        await sb.from("cases").update(update).eq("id", id).select().single(),
        "update case",
      );
      return toCase(row as unknown as Row);
    },

    async listMessages(caseId) {
      const rows = must(
        await sb.from("messages").select("*").eq("case_id", caseId).order("created_at"),
        "list messages",
      );
      return (rows as unknown as Row[]).map(toMessage);
    },
    async addMessage(m) {
      const row = must(
        await sb
          .from("messages")
          .insert({
            case_id: m.caseId,
            sender: m.sender,
            original_text: m.originalText,
            processed_text: m.processedText,
            language: m.language,
            input_type: m.inputType,
            field: m.field,
          })
          .select()
          .single(),
        "add message",
      );
      return toMessage(row as unknown as Row);
    },

    async listReports(caseId) {
      const rows = must(
        await sb
          .from("case_reports")
          .select("*")
          .eq("case_id", caseId)
          .order("version", { ascending: false }),
        "list reports",
      );
      return (rows as unknown as Row[]).map(toReport);
    },
    async addReport(r) {
      const row = must(
        await sb
          .from("case_reports")
          .insert({
            case_id: r.caseId,
            version: r.version,
            structured_data: r.intake,
            pdf_storage_path: r.pdfPath,
            confirmed_at: r.confirmedAt,
          })
          .select()
          .single(),
        "add report",
      );
      return toReport(row as unknown as Row);
    },

    async listDocuments(filter) {
      let query = sb.from("documents").select("*");
      query =
        "caseId" in filter
          ? query.eq("case_id", filter.caseId)
          : query.eq("repository_type", filter.repository);
      const rows = must(await query.order("uploaded_at"), "list documents");
      return (rows as unknown as Row[]).map(toDocument);
    },
    async getDocument(id) {
      const { data, error } = await sb.from("documents").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`get document: ${error.message}`);
      return data ? toDocument(data as Row) : null;
    },
    async addDocument(d) {
      const row = must(
        await sb
          .from("documents")
          .insert({
            case_id: d.caseId,
            repository_type: d.repository,
            storage_path: d.storagePath,
            original_filename: d.filename,
            mime_type: d.mimeType,
            size_bytes: d.size,
            file_hash: d.sha256,
            document_category: d.category,
            extracted_metadata: d.extraction,
            extraction_confidence: d.confidence,
            verification: d.verification,
            user_confirmed: d.userConfirmed,
            notes: d.notes,
          })
          .select()
          .single(),
        "add document",
      );
      return toDocument(row as unknown as Row);
    },
    async updateDocument(id, patch) {
      const update: Row = {};
      if (patch.category) update["document_category"] = patch.category;
      if (patch.extraction !== undefined) update["extracted_metadata"] = patch.extraction;
      if (patch.confidence !== undefined) update["extraction_confidence"] = patch.confidence;
      if (patch.verification) update["verification"] = patch.verification;
      if (patch.userConfirmed !== undefined) update["user_confirmed"] = patch.userConfirmed;
      if (patch.notes !== undefined) update["notes"] = patch.notes;
      const row = must(
        await sb.from("documents").update(update).eq("id", id).select().single(),
        "update document",
      );
      return toDocument(row as unknown as Row);
    },

    async putFile(path, bytes, contentType) {
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType, upsert: false });
      if (error) throw new Error(`upload: ${error.message}`);
    },
    async getFile(path) {
      const { data, error } = await sb.storage.from(BUCKET).download(path);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    },

    async listReferrals(caseId) {
      const rows = must(
        await sb.from("referrals").select("*").eq("case_id", caseId).order("created_at"),
        "list referrals",
      );
      return (rows as unknown as Row[]).map(toReferral);
    },
    async addReferral(r) {
      const row = must(
        await sb
          .from("referrals")
          .insert({
            case_id: r.caseId,
            provider_id: r.providerId,
            recommended_pathway: r.pathway,
            consent_status: r.consentStatus,
            consent_text: r.consentText,
            shared_information: r.shared,
            package_storage_path: r.packagePath,
          })
          .select()
          .single(),
        "add referral",
      );
      return toReferral(row as unknown as Row);
    },

    async audit(entry) {
      const { error } = await sb.from("audit_logs").insert({
        case_id: entry.caseId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
      });
      // An audit failure is logged but never blocks the trader's action.
      if (error) console.error("[audit]", error.message);
    },
  };
}

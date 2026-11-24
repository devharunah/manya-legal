import type { Intake } from "@/lib/intake/fields";
import type { Extraction } from "@/lib/intake/merge";

import type { CaseStatus } from "./state";

export type Language = "en" | "lug";

export interface Profile {
  fullName: string;
  phone: string;
  preferredLanguage: Language;
  businessName: string;
  businessType: string;
  location: string;
}

export type DisputeCategory = "supplier_non_delivery" | "other";

export interface CaseRecord {
  id: string;
  reference: string;
  status: CaseStatus;
  category: DisputeCategory | null;
  language: Language;
  intake: Intake;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  caseId: string;
  sender: "trader" | "manya";
  /** Exactly what the trader typed or said, or the question key MANYA asked. */
  originalText: string;
  /** The English the intake engine read, when the original was Luganda (PRD 10.4). */
  processedText: string | null;
  language: Language;
  inputType: "text" | "voice" | "system";
  /** For MANYA's questions: the fields being asked about, comma-separated (older messages hold one). */
  field: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  caseId: string;
  version: number;
  intake: Intake;
  pdfPath: string;
  confirmedAt: string;
  createdAt: string;
}

export const DOCUMENT_CATEGORIES = [
  "payment_evidence",
  "transaction_evidence",
  "communication_evidence",
  "delivery_evidence",
  "agreement",
  "business_record",
  "other",
  "unknown",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** What was read off a document (PRD 5.6). Every field may be missing. */
export interface DocumentExtraction {
  documentType: string | null;
  date: string | null;
  amount: number | null;
  currency: string | null;
  reference: string | null;
  sender: string | null;
  recipient: string | null;
  description: string | null;
}

/** PRD 5.7: what we checked, kept apart from what we didn't. */
export interface Verification {
  fileIntegrity: "passed" | "failed";
  informationExtraction: "pending" | "completed" | "failed";
  /** Always not_verified: we have no authoritative issuer integration. */
  sourceAuthenticity: "not_verified";
}

export interface EvidenceDocument {
  id: string;
  caseId: string | null;
  repository: "case_workspace" | "business_vault";
  storagePath: string;
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  category: DocumentCategory;
  extraction: DocumentExtraction | null;
  confidence: number | null;
  verification: Verification;
  userConfirmed: boolean;
  notes: string;
  uploadedAt: string;
}

export interface ShareSelection {
  report: boolean;
  documentIndex: boolean;
  chronology: boolean;
  contact: boolean;
  documentIds: string[];
}

export interface Referral {
  id: string;
  caseId: string;
  providerId: string;
  pathway: string;
  consentStatus: "given";
  consentText: string;
  shared: ShareSelection;
  packagePath: string;
  createdAt: string;
}

export interface AuditEntry {
  action:
    | "case.create"
    | "report.generate"
    | "report.download"
    | "document.upload"
    | "document.view"
    | "document.edit"
    | "referral.consent"
    | "referral.download";
  resourceType: "case" | "report" | "document" | "referral";
  resourceId: string;
  caseId: string | null;
}

export type NewMessage = Omit<Message, "id" | "createdAt">;
export type NewReport = Omit<Report, "id" | "createdAt">;
export type NewDocument = Omit<EvidenceDocument, "id" | "uploadedAt">;
export type NewReferral = Omit<Referral, "id" | "createdAt">;
export type CasePatch = Partial<Pick<CaseRecord, "status" | "category" | "intake" | "language">>;
export type DocumentPatch = Partial<
  Pick<
    EvidenceDocument,
    "category" | "extraction" | "confidence" | "verification" | "userConfirmed" | "notes"
  >
>;

/**
 * Everything the app reads or writes, scoped to one signed-in trader. The
 * Supabase implementation relies on row-level security for isolation; the
 * memory one (tests and local dev only) filters by owner itself.
 */
export interface CaseStore {
  readonly userId: string;
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;

  listCases(): Promise<CaseRecord[]>;
  createCase(language: Language): Promise<CaseRecord>;
  getCase(id: string): Promise<CaseRecord | null>;
  updateCase(id: string, patch: CasePatch): Promise<CaseRecord>;

  listMessages(caseId: string): Promise<Message[]>;
  addMessage(message: NewMessage): Promise<Message>;

  listReports(caseId: string): Promise<Report[]>;
  addReport(report: NewReport): Promise<Report>;

  listDocuments(
    filter: { caseId: string } | { repository: "business_vault" },
  ): Promise<EvidenceDocument[]>;
  getDocument(id: string): Promise<EvidenceDocument | null>;
  addDocument(doc: NewDocument): Promise<EvidenceDocument>;
  updateDocument(id: string, patch: DocumentPatch): Promise<EvidenceDocument>;

  putFile(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  getFile(path: string): Promise<Uint8Array | null>;

  listReferrals(caseId: string): Promise<Referral[]>;
  addReferral(referral: NewReferral): Promise<Referral>;

  audit(entry: AuditEntry): Promise<void>;
}

export type { Extraction };

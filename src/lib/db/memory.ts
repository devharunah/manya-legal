import type {
  AuditEntry,
  CaseRecord,
  CaseStore,
  EvidenceDocument,
  Message,
  Profile,
  Referral,
  Report,
} from "@/lib/cases/types";
import { emptyIntake } from "@/lib/intake/fields";

import { caseReference } from "./reference";

/**
 * In-process store for e2e tests and local development without Supabase.
 * Lost on restart, never used in production (see session.ts). Every query
 * filters by owner, mirroring the row-level security the real store relies on.
 */
interface Tables {
  profiles: Map<string, Profile>;
  cases: (CaseRecord & { ownerId: string })[];
  messages: (Message & { ownerId: string })[];
  reports: (Report & { ownerId: string })[];
  documents: (EvidenceDocument & { ownerId: string })[];
  referrals: (Referral & { ownerId: string })[];
  files: Map<string, { bytes: Uint8Array; contentType: string }>;
  audit: (AuditEntry & { ownerId: string; at: string })[];
}

const globalForStore = globalThis as unknown as { __manyaMemory?: Tables };
globalForStore.__manyaMemory ??= {
  profiles: new Map(),
  cases: [],
  messages: [],
  reports: [],
  documents: [],
  referrals: [],
  files: new Map(),
  audit: [],
};
const db: Tables = globalForStore.__manyaMemory;

const now = () => new Date().toISOString();
function strip<T extends { ownerId: string }>(row: T): Omit<T, "ownerId"> {
  return Object.fromEntries(Object.entries(row).filter(([k]) => k !== "ownerId")) as Omit<
    T,
    "ownerId"
  >;
}

export function createMemoryStore(userId: string): CaseStore {
  const mine = <T extends { ownerId: string }>(rows: T[]) =>
    rows.filter((r) => r.ownerId === userId);

  const ownCase = (id: string) => mine(db.cases).find((c) => c.id === id);
  const ownDocument = (id: string) => mine(db.documents).find((d) => d.id === id);

  return {
    userId,
    getProfile: async () => db.profiles.get(userId) ?? null,
    saveProfile: async (profile) => {
      db.profiles.set(userId, profile);
    },

    listCases: async () =>
      mine(db.cases)
        .map(strip)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    createCase: async (language) => {
      const row = {
        id: crypto.randomUUID(),
        ownerId: userId,
        reference: caseReference(mine(db.cases).length + 1),
        status: "draft" as const,
        category: null,
        language,
        intake: emptyIntake(),
        createdAt: now(),
        updatedAt: now(),
      };
      db.cases.push(row);
      return strip(row);
    },
    getCase: async (id) => {
      const row = ownCase(id);
      return row ? strip(row) : null;
    },
    updateCase: async (id, patch) => {
      const row = ownCase(id);
      if (!row) throw new Error("Case not found");
      Object.assign(row, patch, { updatedAt: now() });
      return strip(row);
    },

    listMessages: async (caseId) =>
      mine(db.messages)
        .filter((m) => m.caseId === caseId)
        .map(strip),
    addMessage: async (message) => {
      if (!ownCase(message.caseId)) throw new Error("Case not found");
      const row = { ...message, id: crypto.randomUUID(), createdAt: now(), ownerId: userId };
      db.messages.push(row);
      return strip(row);
    },

    listReports: async (caseId) =>
      mine(db.reports)
        .filter((r) => r.caseId === caseId)
        .map(strip)
        .sort((a, b) => b.version - a.version),
    addReport: async (report) => {
      if (!ownCase(report.caseId)) throw new Error("Case not found");
      const row = { ...report, id: crypto.randomUUID(), createdAt: now(), ownerId: userId };
      db.reports.push(row);
      return strip(row);
    },

    listDocuments: async (filter) =>
      mine(db.documents)
        .filter((d) =>
          "caseId" in filter ? d.caseId === filter.caseId : d.repository === filter.repository,
        )
        .map(strip)
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)),
    getDocument: async (id) => {
      const row = ownDocument(id);
      return row ? strip(row) : null;
    },
    addDocument: async (doc) => {
      if (doc.caseId && !ownCase(doc.caseId)) throw new Error("Case not found");
      const row = { ...doc, id: crypto.randomUUID(), uploadedAt: now(), ownerId: userId };
      db.documents.push(row);
      return strip(row);
    },
    updateDocument: async (id, patch) => {
      const row = ownDocument(id);
      if (!row) throw new Error("Document not found");
      Object.assign(row, patch);
      return strip(row);
    },

    putFile: async (path, bytes, contentType) => {
      if (!path.startsWith(`${userId}/`)) throw new Error("Files live under the owner's folder");
      db.files.set(path, { bytes, contentType });
    },
    getFile: async (path) =>
      path.startsWith(`${userId}/`) ? (db.files.get(path)?.bytes ?? null) : null,

    listReferrals: async (caseId) =>
      mine(db.referrals)
        .filter((r) => r.caseId === caseId)
        .map(strip),
    addReferral: async (referral) => {
      if (!ownCase(referral.caseId)) throw new Error("Case not found");
      const row = { ...referral, id: crypto.randomUUID(), createdAt: now(), ownerId: userId };
      db.referrals.push(row);
      return strip(row);
    },

    audit: async (entry) => {
      db.audit.push({ ...entry, ownerId: userId, at: now() });
    },
  };
}

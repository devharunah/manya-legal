"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/components/app/client-api";
import { DocumentCard, UploadButton } from "@/components/app/evidence-panel";
import { RequireProfile } from "@/components/app/session";
import type { EvidenceDocument } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

function Vault() {
  const t = useT();
  const [docs, setDocs] = useState<EvidenceDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ documents: EvidenceDocument[] }>("/api/documents")
      .then((r) => setDocs(r.documents))
      .catch((e: Error) => setError(e.message));
  }, []);
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!docs)
    return <Loader2 className="size-5 animate-spin text-muted" aria-label={t("common.loading")} />;
  const replace = (d: EvidenceDocument) =>
    setDocs((all) => (all ?? []).map((x) => (x.id === d.id ? d : x)));
  return (
    <div className="space-y-4">
      <UploadButton caseId={null} onUploaded={(d) => setDocs((all) => [...(all ?? []), d])} />
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          {t("evidence.empty")}
        </p>
      ) : (
        docs.map((d) => <DocumentCard key={d.id} doc={d} flags={[]} onChange={replace} />)
      )}
    </div>
  );
}

export default function VaultPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("vault.title")}</h1>
      <p className="mt-2 text-muted">{t("vault.body")}</p>
      <p className="mt-1 mb-6 text-sm text-muted">{t("vault.notShared")}</p>
      <RequireProfile>{() => <Vault />}</RequireProfile>
    </main>
  );
}

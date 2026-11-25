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
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!docs)
    return <Loader2 className="size-5 animate-spin text-ink-3" aria-label={t("common.loading")} />;
  const replace = (d: EvidenceDocument) =>
    setDocs((all) => (all ?? []).map((x) => (x.id === d.id ? d : x)));
  return (
    <div className="space-y-4">
      <UploadButton caseId={null} onUploaded={(d) => setDocs((all) => [...(all ?? []), d])} />
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-ink-3">
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
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-brand-900">{t("vault.title")}</h1>
      <p className="mt-2 text-ink-3">{t("vault.body")}</p>
      <p className="mt-1 mb-6 text-sm text-ink-3">{t("vault.notShared")}</p>
      <RequireProfile>{() => <Vault />}</RequireProfile>
    </div>
  );
}

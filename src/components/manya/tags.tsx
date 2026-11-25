"use client";

import { Badge } from "@/components/ui/badge";
import type { CaseRecord } from "@/lib/cases/types";
import { useT } from "@/lib/i18n/use-t";

/** Marks fictional demo records. Always visible on demo data. */
export function SampleTag() {
  const t = useT();
  return <Badge variant="sample">{t("demo.sampleTag")}</Badge>;
}

/** True for the seeded or live stage-demo cases (fictional Sarah Namusoke story). */
export function isDemoCase(record: Pick<CaseRecord, "intake">): boolean {
  if (record.intake.demo === "live") return true;
  const respondent = record.intake.values["respondent.name"]?.value;
  return respondent === "Daniel Okello" || respondent === "Brian Ssemanda";
}

const STATUS_VARIANT: Record<CaseRecord["status"], "neutral" | "brand" | "warning" | "success"> = {
  draft: "neutral",
  collecting_information: "brand",
  paused: "neutral",
  awaiting_user_confirmation: "warning",
  report_generated: "success",
  completed: "success",
};

/** Case status as colour plus word. */
export function StatusBadge({ status }: { status: CaseRecord["status"] }) {
  const t = useT();
  return <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}

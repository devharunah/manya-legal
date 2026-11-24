import type { Metadata } from "next";
import { connection } from "next/server";

import { AskView } from "@/components/ask-view";
import { hasVoice } from "@/lib/voice/provider";

export const metadata: Metadata = { title: "Ask | Manya Legal" };

export default async function AskPage() {
  // Decide per request, so adding or removing the speech key needs no rebuild.
  await connection();
  return (
    <main>
      <AskView voice={hasVoice()} />
    </main>
  );
}

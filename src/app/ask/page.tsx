import type { Metadata } from "next";

import { AskView } from "@/components/ask-view";

export const metadata: Metadata = { title: "Ask | Manya Legal" };

export default function AskPage() {
  return (
    <main>
      <AskView />
    </main>
  );
}

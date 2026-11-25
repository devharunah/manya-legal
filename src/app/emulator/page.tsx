import type { Metadata } from "next";

import { EmulatorScreen } from "@/components/ussd/emulator-screen";

export const metadata: Metadata = {
  title: "USSD emulator | MANYA",
  description: "Prototype of MANYA's USSD menu for traders without a smartphone or internet.",
};

/**
 * The USSD emulator. Reached only by typing /emulator: nothing in the app
 * links here. It sits outside the public and app layouts, so the phone has
 * the page to itself.
 */
export default function EmulatorPage() {
  return <EmulatorScreen />;
}

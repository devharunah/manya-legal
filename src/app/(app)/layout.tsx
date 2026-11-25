import { AppShell } from "@/components/shell/app-shell";

/** Signed-in pages: Dashboard, My Cases, a case, Business Vault, Legal Support, Profile. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

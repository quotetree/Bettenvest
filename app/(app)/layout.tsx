import { AppShell } from "@/components/AppShell";
import { isLocalStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell localStore={isLocalStore}>{children}</AppShell>;
}

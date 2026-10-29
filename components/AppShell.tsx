"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { SettingsButton } from "@/components/SettingsDrawer";

export function AppShell({
  children,
  localStore,
}: {
  children: React.ReactNode;
  localStore: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-6 px-4 sm:px-6">
          <Link href="/deal-tracker" className="flex shrink-0 items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
              <Home size={16} />
            </span>
            <span className="hidden sm:inline">Bettenvest</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {localStore ? (
        <div className="bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
          Data is saved on this computer in .data. Add Supabase keys in .env.local to use the cloud database.
        </div>
      ) : null}
      <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      <SettingsButton />
    </div>
  );
}

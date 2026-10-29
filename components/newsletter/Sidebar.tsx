"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shortDate } from "@/lib/format";
import type { CampaignSummary } from "@/lib/types";

export function NewsletterSidebar({ campaigns }: { campaigns: CampaignSummary[] }) {
  const pathname = usePathname();
  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white md:w-72 md:border-b-0 md:border-r">
      <div className="p-4">
        <Link
          href="/newsletter"
          className={`block rounded-xl px-3 py-2 text-sm font-medium ${pathname === "/newsletter" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
        >
          Create
        </Link>
        <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sent folders</p>
        <div className="mt-2 space-y-1">
          {campaigns.length === 0 ? <p className="px-3 py-2 text-sm text-slate-400">No newsletters yet</p> : null}
          {campaigns.map((campaign) => {
            const href = `/newsletter/${campaign.id}`;
            const active = pathname === href;
            return (
              <Link key={campaign.id} href={href} className={`block rounded-xl px-3 py-2 ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <div className="truncate text-sm font-medium">{campaign.subject || campaign.name}</div>
                <div className="text-xs capitalize text-slate-500">
                  {campaign.status} · {shortDate(campaign.sentAt || campaign.scheduledAt || campaign.createdAt)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

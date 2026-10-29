import Link from "next/link";
import { notFound } from "next/navigation";
import { SendNow } from "@/components/newsletter/SendNow";
import { money, shortDate } from "@/lib/format";
import { store } from "@/lib/store";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await store.getCampaign(id);
  if (!campaign) notFound();
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{campaign.status}</p>
      <h1 className="mt-1 text-2xl font-semibold">{campaign.subject || campaign.name}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {campaign.sentAt
          ? `Sent ${shortDate(campaign.sentAt)}`
          : campaign.scheduledAt
            ? `Scheduled ${shortDate(campaign.scheduledAt)}`
            : `Created ${shortDate(campaign.createdAt)}`}
      </p>
      {campaign.deliveryNote ? <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{campaign.deliveryNote}</p> : null}
      {campaign.status !== "sent" ? <SendNow id={campaign.id} /> : null}
      <h2 className="mt-8 font-semibold">Properties in this folder</h2>
      <ul className="mt-3 divide-y rounded-2xl border border-slate-200 bg-white">
        {campaign.pages.map((page) => (
          <li key={page.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-medium">{page.deal.street || "Untitled property"}</span>
              <span className="ml-2 text-slate-500">{money(page.deal.listPrice)}</span>
            </span>
            <Link href={`/p/${page.slug}`} className="text-blue-600">
              Open
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-semibold">Investors and the pages they receive</h2>
      <div className="mt-3 space-y-3">
        {campaign.recipients.map((recipient) => (
          <div key={recipient.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-medium">
              {recipient.investor.fullName} · {recipient.investor.email}
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {recipient.matchedLandingPageIds.map((pageId) => {
                const page = campaign.pages.find((item) => item.id === pageId);
                return <li key={pageId}>{page?.deal.street || "Landing page"}</li>;
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

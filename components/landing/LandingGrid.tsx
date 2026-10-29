"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Share2, Trash2 } from "lucide-react";
import { deleteLanding } from "@/lib/actions/landing";
import { fileHref, money, shortDate } from "@/lib/format";
import type { LandingPageListItem } from "@/lib/types";
import { Button, EmptyState, PageHeader } from "@/components/ui";

export function LandingGrid({
  pages,
  cities,
  query,
  city,
  status,
  initials,
}: {
  pages: LandingPageListItem[];
  cities: string[];
  query: string;
  city: string;
  status: string;
  initials: string;
}) {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Landing Pages"
        subtitle="Underwritten deals you can share with investors."
        actions={
          <div className="flex gap-2">
            <Button href="/newsletter?select=all" variant="secondary">
              <Share2 size={16} /> Share all
            </Button>
            <Button href="/landing-pages/new">Create landing page</Button>
          </div>
        }
      />
      <form className="mb-5 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search..."
          className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <select name="city" defaultValue={city} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Location">
          <option value="">Location</option>
          {cities.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Status">
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {pages.length === 0 ? (
        <EmptyState title="No landing pages yet" body="Create one from a Go deal and sold-comp PDFs. The ARV and MAO prompts run before the page is published." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <article key={page.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Link href={`/landing-pages/${page.id}`} className="block">
                <div className="relative h-44 bg-slate-100">
                  {page.deal.photos[0] ? (
                    <img src={fileHref("property-photos", page.deal.photos[0])} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">No photo</div>
                  )}
                  <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                    {page.status === "active" ? "Active" : "Draft"}
                  </span>
                </div>
                <div className="px-4 pt-4">
                  <h2 className="font-semibold">{page.deal.street || "Untitled property"}</h2>
                  <p className="text-sm text-slate-500">
                    {[page.deal.city, page.deal.state, page.deal.zip].filter(Boolean).join(", ")}
                  </p>
                </div>
              </Link>
              <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center text-xs text-slate-500">
                <div>
                  <div className="uppercase">Price</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{money(page.deal.listPrice)}</div>
                </div>
                <div>
                  <div className="uppercase">Offers</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{page.offerCount}</div>
                </div>
                <div>
                  <div className="uppercase">Published</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{shortDate(page.publishedAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-3">
                <Button href={`/landing-pages/${page.id}`} variant="secondary" className="mr-auto">
                  View activity
                </Button>
                <IconButton label="Copy share link" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`)}>
                  <Share2 size={16} />
                </IconButton>
                <IconButton label="View landing page" href={`/p/${page.slug}`}>
                  <Eye size={16} />
                </IconButton>
                <IconButton label="Edit landing page" href={`/landing-pages/${page.id}/edit`}>
                  <Pencil size={16} />
                </IconButton>
                <DeleteButton id={page.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  href,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const className = "grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100";
  if (href) {
    return (
      <Link href={href} aria-label={label} className={className} target={href.startsWith("/p/") ? "_blank" : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Delete landing page"
      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
      onClick={async () => {
        if (!confirm("Delete this landing page?")) return;
        const result = await deleteLanding(id);
        if (result.ok) router.refresh();
        else alert(result.error);
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}

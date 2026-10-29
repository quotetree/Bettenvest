"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, FileText, Pencil, Share2, X } from "lucide-react";
import { createOfferAction } from "@/lib/actions/landing";
import { ago, money } from "@/lib/format";
import type { ActivitySnapshot, LandingPageDetail } from "@/lib/types";
import { Button, inputClass } from "@/components/ui";

export function ActivityScreen({ page, activity }: { page: LandingPageDetail; activity: ActivitySnapshot }) {
  const router = useRouter();
  const [offerPage, setOfferPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const pageSize = 5;
  const offers = activity.offers.slice(offerPage * pageSize, offerPage * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(activity.offers.length / pageSize));
  const shareUrl = () => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{page.deal.street || "Untitled property"}</h1>
            <p className="mt-1 text-sm text-slate-500">Track engagement and offers for this landing page</p>
          </div>
          <Link href="/landing-pages" aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Stat label="Offers received" value={activity.stats.offers} className="bg-emerald-50" />
          <Stat label="Total views" value={activity.stats.views} className="bg-blue-50" />
          <Stat label="Unique visitors" value={activity.stats.uniqueVisitors} className="bg-amber-50" />
        </div>

        <h2 className="mt-8 text-lg font-semibold">Offers</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Investor", "Amount", "Date", "Contact", "Notes"].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No offers yet.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{offer.investorName}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{money(offer.amount)}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{ago(offer.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div>{offer.phone || "—"}</div>
                      <div className="text-slate-500">{offer.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-label="Show notes"
                        className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-white"
                        onClick={() => setNotesFor(notesFor === offer.id ? null : offer.id)}
                      >
                        <FileText size={16} />
                      </button>
                      {notesFor === offer.id ? <p className="mt-2 max-w-xs text-slate-600">{offer.notes || offer.terms || "No notes"}</p> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-3">
            <Button variant="secondary" onClick={() => setAdding((value) => !value)}>
              Add
            </Button>
            <button type="button" className="rounded-lg border px-2 py-1" onClick={() => setOfferPage((value) => Math.max(0, value - 1))} aria-label="Previous offers">
              ‹
            </button>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-sm text-white">{offerPage + 1}</span>
            <button type="button" className="rounded-lg border px-2 py-1" onClick={() => setOfferPage((value) => Math.min(pageCount - 1, value + 1))} aria-label="Next offers">
              ›
            </button>
          </div>
        </div>
        {adding ? (
          <OfferForm
            onSubmit={async (values) => {
              const result = await createOfferAction({ landingPageId: page.id, ...values });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setAdding(false);
              setMessage("Offer added");
              router.refresh();
            }}
          />
        ) : null}

        <h2 className="mt-8 text-lg font-semibold">Interested visitors</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Investor", "Interest", "Last viewed", "Contact"].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.interested.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No tracked visitors yet.
                  </td>
                </tr>
              ) : (
                activity.interested.map((visitor) => (
                  <tr key={visitor.key} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{visitor.name}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${visitor.interest === "High" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                        {visitor.interest}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{ago(visitor.lastViewed)}</td>
                    <td className="px-3 py-3">
                      <div>{visitor.phone || "—"}</div>
                      <div className="text-slate-500">{visitor.email}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Button variant="secondary" onClick={shareUrl}>
            <Share2 size={16} /> Share
          </Button>
          <Link href={`/p/${page.slug}`} target="_blank" aria-label="View landing page" className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <Eye size={18} />
          </Link>
          <Link href={`/landing-pages/${page.id}/edit`} aria-label="Edit landing page" className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <Pencil size={18} />
          </Link>
          <Link href="/landing-pages" className="ml-auto text-sm font-medium text-blue-600">
            Close
          </Link>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${className}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function OfferForm({
  onSubmit,
}: {
  onSubmit: (values: {
    investorName: string;
    amount: number | null;
    terms: string;
    phone: string;
    email: string;
    notes: string;
  }) => Promise<void>;
}) {
  const [investorName, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          investorName,
          amount: amount ? Number(amount) : null,
          phone,
          email,
          notes,
          terms,
        });
      }}
    >
      <input className={inputClass} placeholder="Investor name" value={investorName} onChange={(event) => setName(event.target.value)} required />
      <input className={inputClass} placeholder="Amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
      <input className={inputClass} placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <input className={inputClass} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <textarea className={`${inputClass} md:col-span-2`} placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <input className={`${inputClass} md:col-span-2`} placeholder="Terms" value={terms} onChange={(event) => setTerms(event.target.value)} />
      <Button type="submit">Save offer</Button>
    </form>
  );
}

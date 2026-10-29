"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDealPhotos, deleteDealAction, removeDealPhoto, updateDealAction } from "@/lib/actions/deals";
import { CONDITIONS, DEAL_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { fileHref } from "@/lib/format";
import type { Deal, DealStatus } from "@/lib/types";

const field =
  "w-full rounded-xl border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500";

export function DealForm({ deal }: { deal: Deal }) {
  const router = useRouter();
  const [form, setForm] = useState(deal);
  const [photos, setPhotos] = useState(deal.photos);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function set<K extends keyof Deal>(key: K, value: Deal[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function numberValue(value: string) {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function save() {
    setPending(true);
    const result = await updateDealAction(deal.id, {
      status: form.status,
      listingId: form.listingId,
      street: form.street,
      city: form.city,
      state: form.state,
      zip: form.zip,
      county: form.county,
      listPrice: form.listPrice,
      beds: form.beds,
      baths: form.baths,
      livingSqft: form.livingSqft,
      lotSqft: form.lotSqft,
      stories: form.stories,
      yearBuilt: form.yearBuilt,
      garage: form.garage,
      daysOnMarket: form.daysOnMarket,
      cdom: form.cdom,
      condition: form.condition,
      propertyType: form.propertyType,
      agentName: form.agentName,
      agentPhone: form.agentPhone,
      agentOffice: form.agentOffice,
      agentEmail: form.agentEmail,
      agentNotes: form.agentNotes,
    });
    setPending(false);
    setMessage(result.ok ? "Saved" : result.error);
    router.refresh();
  }

  const conditionOptions = form.condition && !CONDITIONS.includes(form.condition) ? [form.condition, ...CONDITIONS] : CONDITIONS;
  const typeOptions =
    form.propertyType && !PROPERTY_TYPES.includes(form.propertyType)
      ? [form.propertyType, ...PROPERTY_TYPES]
      : PROPERTY_TYPES;

  return (
    <div className="min-h-full bg-[#070b14] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/deal-tracker" className="text-sm text-slate-400 hover:text-white">
          Deal tracker
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Subject property</h1>
        <p className="mt-2 text-slate-400">Use the MLS sheet for facts. Verify all parsed values against the original PDF.</p>
        {deal.sourcePdfPath ? (
          <a href={fileHref("mls-pdfs", deal.sourcePdfPath)} target="_blank" className="mt-3 inline-block text-sm text-blue-400">
            Open original PDF
          </a>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <label className="md:col-span-6">
            <span className="mb-1.5 block text-sm text-slate-400">Street address</span>
            <input className={field} value={form.street} onChange={(event) => set("street", event.target.value)} />
          </label>
          <label className="md:col-span-4">
            <span className="mb-1.5 block text-sm text-slate-400">City</span>
            <input className={field} value={form.city} onChange={(event) => set("city", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">State</span>
            <input className={field} value={form.state} onChange={(event) => set("state", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">Zip code</span>
            <input className={field} value={form.zip} onChange={(event) => set("zip", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">County</span>
            <input className={field} value={form.county} onChange={(event) => set("county", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">Status</span>
            <select className={field} value={form.status} onChange={(event) => set("status", event.target.value as DealStatus)}>
              {DEAL_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="Asking price ($)" value={form.listPrice} onChange={(value) => set("listPrice", value)} span={2} />
          <NumberField label="Living area (sq ft)" value={form.livingSqft} onChange={(value) => set("livingSqft", value)} span={2} />
          <NumberField label="Days on market" value={form.daysOnMarket} onChange={(value) => set("daysOnMarket", value)} span={2} />
          <NumberField label="Beds" value={form.beds} onChange={(value) => set("beds", value)} span={2} />
          <NumberField label="Baths" value={form.baths} onChange={(value) => set("baths", value)} span={2} />
          <NumberField label="Stories" value={form.stories} onChange={(value) => set("stories", value)} span={2} />
          <NumberField label="Lot size (sq ft)" value={form.lotSqft} onChange={(value) => set("lotSqft", value)} span={3} />
          <label className="md:col-span-3">
            <span className="mb-1.5 block text-sm text-slate-400">Garage / parking</span>
            <input className={field} value={form.garage} onChange={(event) => set("garage", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">MLS listing ID</span>
            <input className={field} value={form.listingId} onChange={(event) => set("listingId", event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">Condition</span>
            <select className={field} value={form.condition} onChange={(event) => set("condition", event.target.value)}>
              <option value="">Select</option>
              {conditionOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm text-slate-400">Property type</span>
            <select className={field} value={form.propertyType} onChange={(event) => set("propertyType", event.target.value)}>
              <option value="">Select</option>
              {typeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <NumberField label="CDAM" value={form.cdom} onChange={(value) => set("cdom", value)} span={2} />
          <NumberField label="Year built" value={form.yearBuilt} onChange={(value) => set("yearBuilt", value)} span={2} />
          <label className="md:col-span-3">
            <span className="mb-1.5 block text-sm text-slate-400">Agent full name</span>
            <input className={field} value={form.agentName} onChange={(event) => set("agentName", event.target.value)} />
          </label>
          <label className="md:col-span-3">
            <span className="mb-1.5 block text-sm text-slate-400">Agent phone number</span>
            <input className={field} value={form.agentPhone} onChange={(event) => set("agentPhone", event.target.value)} />
          </label>
          <label className="md:col-span-3">
            <span className="mb-1.5 block text-sm text-slate-400">Agent office</span>
            <input className={field} value={form.agentOffice} onChange={(event) => set("agentOffice", event.target.value)} />
          </label>
          <label className="md:col-span-3">
            <span className="mb-1.5 block text-sm text-slate-400">Agent email</span>
            <input className={field} value={form.agentEmail} onChange={(event) => set("agentEmail", event.target.value)} />
          </label>
          <label className="md:col-span-6">
            <span className="mb-1.5 block text-sm text-slate-400">Listing-agent conversation notes (facts only)</span>
            <textarea className={`${field} min-h-28`} value={form.agentNotes} onChange={(event) => set("agentNotes", event.target.value)} />
          </label>
        </div>

        <div className="mt-6">
          <p className="text-sm text-slate-400">Subject photos</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div key={photo} className="relative">
                <img src={fileHref("property-photos", photo)} alt="" className="h-24 w-32 rounded-lg object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs"
                  onClick={async () => {
                    const result = await removeDealPhoto(deal.id, photo);
                    if (result.ok) setPhotos(result.photos);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-3 block text-sm"
            onChange={async (event) => {
              const chosen = event.target.files;
              if (!chosen?.length) return;
              const formData = new FormData();
              Array.from(chosen).forEach((file) => formData.append("photos", file));
              const result = await addDealPhotos(deal.id, formData);
              if (result.ok) setPhotos(result.photos);
              else setMessage(result.error);
              event.target.value = "";
            }}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">
            {pending ? "Saving…" : "Save property"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-rose-400 px-4 py-2 text-rose-300"
            onClick={async () => {
              if (!confirm("Delete this property and any landing page tied to it?")) return;
              const result = await deleteDealAction(deal.id);
              if (result.ok) router.push("/deal-tracker");
              else setMessage(result.error);
            }}
          >
            Delete
          </button>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );

  function NumberField({
    label,
    value,
    onChange,
    span,
  }: {
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    span: number;
  }) {
    return (
      <label className={span === 3 ? "md:col-span-3" : "md:col-span-2"}>
        <span className="mb-1.5 block text-sm text-slate-400">{label}</span>
        <input
          className={field}
          inputMode="decimal"
          value={value ?? ""}
          onChange={(event) => onChange(numberValue(event.target.value))}
        />
      </label>
    );
  }
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDealPhotos, uploadMlsPdfs } from "@/lib/actions/deals";
import { extractCompPdfs, publishLanding, runUnderwritingAction, updateLanding } from "@/lib/actions/landing";
import { fileHref, money, plainNumber } from "@/lib/format";
import type { CompInput, Deal, RehabCategory } from "@/lib/types";
import { REHAB_LABEL, REHAB_RATES, underwritingDollars } from "@/lib/underwriting/mao";
import { CompEditor, type EditableComp } from "@/components/landing/CompEditor";
import { Button, inputClass } from "@/components/ui";

type Mode = "create" | "edit";

export function LandingWizard({
  mode,
  pageId,
  goDeals,
  initialDeal,
  initialComps = [],
  initial,
}: {
  mode: Mode;
  pageId?: string;
  goDeals: Deal[];
  initialDeal: Deal | null;
  initialComps?: CompInput[];
  initial?: {
    arvMin: number | null;
    arvMax: number | null;
    category: RehabCategory | null;
    reason: string;
    narrative: string;
    rentMin: number | null;
    rentMax: number | null;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(mode === "edit" ? 3 : 1);
  const [deal, setDeal] = useState<Deal | null>(initialDeal);
  const [uploads, setUploads] = useState<Deal[]>([]);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [comps, setComps] = useState<EditableComp[]>(
    initialComps.map((comp) => ({ ...comp, key: crypto.randomUUID() })),
  );
  const [arvMin, setArvMin] = useState<number | null>(initial?.arvMin ?? null);
  const [arvMax, setArvMax] = useState<number | null>(initial?.arvMax ?? null);
  const [category, setCategory] = useState<RehabCategory | null>(initial?.category ?? null);
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [narrative, setNarrative] = useState(initial?.narrative ?? "");
  const [rentMin, setRentMin] = useState<number | null>(initial?.rentMin ?? null);
  const [rentMax, setRentMax] = useState<number | null>(initial?.rentMax ?? null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const dollars = useMemo(
    () => underwritingDollars(deal?.livingSqft ?? null, category, arvMin, arvMax),
    [deal?.livingSqft, category, arvMin, arvMax],
  );

  function patchDeal(patch: Partial<Deal>) {
    setDeal((current) => (current ? { ...current, ...patch } : current));
  }

  async function onSubjectFiles(files: File[]) {
    setPending(true);
    setMessage("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const result = await uploadMlsPdfs(formData);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const deals = result.deals.flatMap((item) => (item.deal ? [item.deal] : []));
    setUploads(deals);
    setUploadIndex(0);
    if (deals[0]) setDeal(deals[0]);
    const warning = result.deals.find((item) => item.warning)?.warning;
    if (warning) setMessage(warning);
  }

  async function onCompFiles(files: File[]) {
    setPending(true);
    setMessage("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const result = await extractCompPdfs(formData);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setComps((current) => [...current, ...result.comps.map((comp) => ({ ...comp, key: crypto.randomUUID() }))]);
    if (result.warnings[0]) setMessage(result.warnings[0]);
  }

  async function analyze() {
    if (!deal) return;
    setPending(true);
    setMessage("");
    const result = await runUnderwritingAction(
      deal.id,
      comps.map(({ key: _key, ...comp }) => comp),
    );
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      setStep(3);
      return;
    }
    setArvMin(result.arvMin);
    setArvMax(result.arvMax);
    setCategory(result.category);
    setReason(result.reason);
    setNarrative(result.narrative);
    setMessage(result.warning || (result.ai ? "Analysis finished. Review the numbers before publishing." : ""));
    setStep(3);
  }

  async function save() {
    if (!deal) return;
    setPending(true);
    const payload = {
      dealId: deal.id,
      city: deal.city,
      county: deal.county,
      listPrice: deal.listPrice,
      livingSqft: deal.livingSqft,
      agentNotes: deal.agentNotes,
      arvMin,
      arvMax,
      category,
      reason,
      narrative,
      rentMin,
      rentMax,
      comps: comps.map(({ key: _key, ...comp }) => comp),
    };
    const result = mode === "edit" && pageId ? await updateLanding(pageId, payload) : await publishLanding(payload);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    router.push(`/landing-pages/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <Link href="/landing-pages" className="text-sm text-slate-500">
        Landing pages
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{mode === "edit" ? "Edit landing page" : "Create landing page"}</h1>
      {mode === "create" ? (
        <ol className="mt-4 flex gap-3 text-sm text-slate-500">
          <li className={step === 1 ? "font-semibold text-blue-700" : ""}>1. Subject</li>
          <li className={step === 2 ? "font-semibold text-blue-700" : ""}>2. Comp PDFs</li>
          <li className={step === 3 ? "font-semibold text-blue-700" : ""}>3. Review</li>
        </ol>
      ) : null}

      {step === 1 ? (
        <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium">
            Go properties
            <select
              className={`${inputClass} mt-1`}
              value={deal && !uploads.length ? deal.id : ""}
              onChange={(event) => {
                const next = goDeals.find((item) => item.id === event.target.value) ?? null;
                setUploads([]);
                setDeal(next);
              }}
            >
              <option value="">Select a property marked Go</option>
              {goDeals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.street || "Untitled"} — {item.city}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-medium">Or upload an MLS PDF</p>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="mt-2 block text-sm"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void onSubjectFiles(files);
              }}
            />
          </div>
          {uploads.length > 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <p className="text-sm">
                {uploadIndex + 1} of {uploads.length}: {uploads[uploadIndex]?.street || "Untitled property"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous property"
                  className="rounded-lg border bg-white p-2"
                  onClick={() => {
                    const next = Math.max(0, uploadIndex - 1);
                    setUploadIndex(next);
                    setDeal(uploads[next] ?? null);
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <select
                  aria-label="Choose an uploaded property"
                  className="rounded-lg border bg-white px-2 text-sm"
                  value={uploadIndex}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setUploadIndex(next);
                    setDeal(uploads[next] ?? null);
                  }}
                >
                  {uploads.map((item, itemIndex) => (
                    <option key={item.id} value={itemIndex}>
                      {item.street || "Untitled"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label="Next property"
                  className="rounded-lg border bg-white p-2"
                  onClick={() => {
                    const next = Math.min(uploads.length - 1, uploadIndex + 1);
                    setUploadIndex(next);
                    setDeal(uploads[next] ?? null);
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
          <Button disabled={!deal || pending} onClick={() => setStep(2)}>
            Continue
          </Button>
        </section>
      ) : null}

      {step === 2 && deal ? (
        <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-medium">Subject: {deal.street || "Untitled property"}</p>
          <label className="block text-sm">
            Sold comp PDFs
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="mt-2 block"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void onCompFiles(files);
                event.target.value = "";
              }}
            />
          </label>
          <p className="text-sm text-slate-500">{comps.length} comp{comps.length === 1 ? "" : "s"} ready.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={pending} onClick={() => void analyze()}>
              {pending ? "Running prompts…" : "Run underwriting"}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 && deal ? (
        <section className="mt-6 space-y-5">
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
            <h2 className="md:col-span-2 font-semibold">{deal.street || "Untitled property"}</h2>
            <label className="text-sm">
              City
              <input className={`${inputClass} mt-1`} value={deal.city} onChange={(event) => patchDeal({ city: event.target.value })} />
            </label>
            <label className="text-sm">
              County
              <input className={`${inputClass} mt-1`} value={deal.county} onChange={(event) => patchDeal({ county: event.target.value })} />
            </label>
            <label className="text-sm">
              List price
              <input className={`${inputClass} mt-1`} value={deal.listPrice ?? ""} onChange={(event) => patchDeal({ listPrice: event.target.value === "" ? null : Number(event.target.value) })} />
            </label>
            <label className="text-sm">
              Living area (sq ft)
              <input className={`${inputClass} mt-1`} value={deal.livingSqft ?? ""} onChange={(event) => patchDeal({ livingSqft: event.target.value === "" ? null : Number(event.target.value) })} />
            </label>
            <label className="text-sm">
              ARV min
              <input className={`${inputClass} mt-1`} value={arvMin ?? ""} onChange={(event) => setArvMin(event.target.value === "" ? null : Number(event.target.value))} />
            </label>
            <label className="text-sm">
              ARV max
              <input className={`${inputClass} mt-1`} value={arvMax ?? ""} onChange={(event) => setArvMax(event.target.value === "" ? null : Number(event.target.value))} />
            </label>
            <label className="text-sm">
              Rehab category
              <select className={`${inputClass} mt-1`} value={category ?? ""} onChange={(event) => setCategory((event.target.value || null) as RehabCategory | null)}>
                <option value="">Select</option>
                <option value="light">Light rehab — $30/sqft</option>
                <option value="average">Average rehab — $40/sqft</option>
                <option value="heavy">Heavy rehab — $50/sqft</option>
              </select>
            </label>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p>Base repair: {money(dollars.repairs)} {category ? `(${REHAB_LABEL[category]})` : ""}</p>
              {deal.livingSqft && category ? (
                <p className="mt-1 text-slate-500">
                  {plainNumber(deal.livingSqft)} sqft × ${REHAB_RATES[category]} × 1.20
                </p>
              ) : null}
              <p className="mt-2">MAO range: {money(dollars.maoMin)} – {money(dollars.maoMax)}</p>
            </div>
            <label className="text-sm">
              Rent min
              <input className={`${inputClass} mt-1`} value={rentMin ?? ""} onChange={(event) => setRentMin(event.target.value === "" ? null : Number(event.target.value))} />
            </label>
            <label className="text-sm">
              Rent max
              <input className={`${inputClass} mt-1`} value={rentMax ?? ""} onChange={(event) => setRentMax(event.target.value === "" ? null : Number(event.target.value))} />
            </label>
            <label className="md:col-span-2 text-sm">
              Repair notes
              <textarea className={`${inputClass} mt-1 min-h-20`} value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            <label className="md:col-span-2 text-sm">
              ARV narrative
              <textarea className={`${inputClass} mt-1 min-h-24`} value={narrative} onChange={(event) => setNarrative(event.target.value)} />
            </label>
            <label className="md:col-span-2 text-sm">
              Notes from listing agent
              <textarea className={`${inputClass} mt-1 min-h-24`} value={deal.agentNotes} onChange={(event) => patchDeal({ agentNotes: event.target.value })} />
            </label>
            <div className="md:col-span-2">
              <p className="text-sm font-medium">Photos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {deal.photos.map((photo) => (
                  <img key={photo} src={fileHref("property-photos", photo)} alt="" className="h-20 w-28 rounded-lg object-cover" />
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-2 block text-sm"
                onChange={async (event) => {
                  const files = event.target.files;
                  if (!files?.length) return;
                  const formData = new FormData();
                  Array.from(files).forEach((file) => formData.append("photos", file));
                  const result = await addDealPhotos(deal.id, formData);
                  if (result.ok) patchDeal({ photos: result.photos });
                  else setMessage(result.error);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
          <CompEditor comps={comps} onChange={setComps} />
          <div className="flex flex-wrap gap-2">
            {mode === "create" ? (
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
            ) : null}
            <Button disabled={pending} onClick={() => void save()}>
              {pending ? "Saving…" : mode === "edit" ? "Save landing page" : "Publish landing page"}
            </Button>
          </div>
        </section>
      ) : null}
      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

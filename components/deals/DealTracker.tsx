"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { createBlankDeal, updateDealStatus, uploadMlsPdfs } from "@/lib/actions/deals";
import { DEAL_STATUSES } from "@/lib/constants";
import { bedBath, damCdam, money, plainNumber, shortDate } from "@/lib/format";
import type { Deal, DealStatus } from "@/lib/types";
import { Button, EmptyState, Modal, PageHeader } from "@/components/ui";

const statusClass: Record<DealStatus, string> = {
  go: "bg-emerald-50 text-emerald-700",
  no_go: "bg-rose-50 text-rose-700",
  follow_up: "bg-amber-50 text-amber-800",
  no_answer: "bg-slate-100 text-slate-600",
  deal_desk: "bg-blue-50 text-blue-700",
};

export function DealTracker({ deals }: { deals: Deal[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Deal Tracker"
        subtitle="Upload MLS sheets and mark each property go, no go, follow up, no answer, or deal desk."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add properties
          </Button>
        }
      />
      {deals.length === 0 ? (
        <EmptyState
          title="No subject properties yet"
          body="Upload one or more MLS PDFs. The property card opens so you can check the parsed facts against the original sheet."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1400px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Status",
                  "Date uploaded",
                  "Listing ID",
                  "Street address",
                  "City",
                  "State",
                  "Zip",
                  "List price",
                  "Br/Ba",
                  "LSQFT",
                  "DAM/CDAM",
                  "Agent full name",
                  "Agent phone",
                  "Agent office",
                  "Agent email",
                ].map((label) => (
                  <th key={label} className="whitespace-nowrap px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <StatusSelect id={deal.id} status={deal.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{shortDate(deal.uploadedAt)}</td>
                  <td className="px-3 py-3">{deal.listingId || "—"}</td>
                  <td className="px-3 py-3">
                    <Link href={`/deal-tracker/${deal.id}`} className="font-medium text-blue-600 hover:underline">
                      {deal.street || "Untitled property"}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{deal.city || "—"}</td>
                  <td className="px-3 py-3">{deal.state || "—"}</td>
                  <td className="px-3 py-3">{deal.zip || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{money(deal.listPrice)}</td>
                  <td className="px-3 py-3">{bedBath(deal.beds, deal.baths)}</td>
                  <td className="px-3 py-3">{plainNumber(deal.livingSqft)}</td>
                  <td className="px-3 py-3">{damCdam(deal.daysOnMarket, deal.cdom)}</td>
                  <td className="px-3 py-3">{deal.agentName || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{deal.agentPhone || "—"}</td>
                  <td className="px-3 py-3">{deal.agentOffice || "—"}</td>
                  <td className="px-3 py-3">{deal.agentEmail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <UploadModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function StatusSelect({ id, status }: { id: string; status: DealStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  return (
    <select
      aria-label="Deal status"
      value={value}
      onChange={async (event) => {
        const next = event.target.value as DealStatus;
        setValue(next);
        const result = await updateDealStatus(id, next);
        if (!result.ok) setValue(status);
        router.refresh();
      }}
      className={`rounded-lg border-0 px-2 py-1 text-sm font-medium ${statusClass[value]}`}
    >
      {DEAL_STATUSES.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{ id: string; label: string; warning: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const current = results[index];
  const label = useMemo(() => (results.length ? `${index + 1} of ${results.length}` : ""), [index, results.length]);

  function reset() {
    setFiles([]);
    setResults([]);
    setIndex(0);
    setError("");
  }

  async function processFiles() {
    setPending(true);
    setError("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const result = await uploadMlsPdfs(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResults(
      result.deals.flatMap((item) =>
        item.deal
          ? [{ id: item.deal.id, label: item.deal.street || item.deal.city || "Untitled property", warning: item.warning }]
          : [],
      ),
    );
    setIndex(0);
    if (!result.deals.some((item) => item.deal)) setError(result.deals[0]?.warning || "Nothing was uploaded");
    router.refresh();
  }

  return (
    <Modal
      open={open}
      title="Upload subject properties"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      {results.length === 0 ? (
        <div className="space-y-4">
          <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <span className="font-medium">Drop MLS PDFs here, or click to choose several</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="mt-3 block w-full text-sm"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          {files.length > 0 ? (
            <p className="text-sm text-slate-500">
              {files.length} file{files.length === 1 ? "" : "s"} ready: {files.map((file) => file.name).join(", ")}
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending || files.length === 0} onClick={processFiles}>
              {pending ? "Reading PDFs…" : "Process PDFs"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={async () => {
                const result = await createBlankDeal();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.push(`/deal-tracker/${result.id}`);
                router.refresh();
              }}
            >
              Enter details without a PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous file" onClick={() => setIndex((value) => Math.max(0, value - 1))} className="rounded-lg border p-2">
                <ChevronLeft size={16} />
              </button>
              <select
                aria-label="Choose a file"
                value={index}
                onChange={(event) => setIndex(Number(event.target.value))}
                className="rounded-lg border px-2 py-2 text-sm"
              >
                {results.map((result, resultIndex) => (
                  <option key={result.id} value={resultIndex}>
                    {resultIndex + 1}. {result.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Next file"
                onClick={() => setIndex((value) => Math.min(results.length - 1, value + 1))}
                className="rounded-lg border p-2"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {current ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold">{current.label}</p>
              {current.warning ? <p className="mt-2 text-sm text-amber-700">{current.warning}</p> : null}
              <Button href={`/deal-tracker/${current.id}`} className="mt-4">
                Open property card
              </Button>
            </div>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

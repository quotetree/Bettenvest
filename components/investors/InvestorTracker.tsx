"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { blankInvestor } from "@/lib/blank";
import { importInvestorCsv, saveInvestors, updateInvestorPriority } from "@/lib/actions/investors";
import { PRIORITIES } from "@/lib/constants";
import { priceRange, shortDate } from "@/lib/format";
import type { Investor, InvestorInput, Priority } from "@/lib/types";
import { InvestorFields } from "@/components/investors/InvestorFields";
import { Button, EmptyState, Modal, PageHeader } from "@/components/ui";

const priorityClass: Record<Priority, string> = {
  hot: "bg-rose-50 text-rose-700",
  warm: "bg-amber-50 text-amber-800",
  cold: "bg-sky-50 text-sky-700",
};

export function InvestorTracker({ investors }: { investors: Investor[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Investor Leads"
        subtitle="Store contact details and buying criteria. Newsletters use cities, counties, and price range to decide who receives each landing page."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add investors
          </Button>
        }
      />
      {investors.length === 0 ? (
        <EmptyState title="No investors yet" body="Add investors one at a time, several in a row, or import a CSV." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Priority",
                  "Date added",
                  "Full name",
                  "Phone",
                  "Email",
                  "Investor type",
                  "Preferred counties",
                  "Preferred cities",
                  "Price range",
                  "Funding",
                  "CRM link",
                  "Notes",
                ].map((label) => (
                  <th key={label} className="whitespace-nowrap px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investors.map((investor) => (
                <tr key={investor.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <PrioritySelect id={investor.id} priority={investor.priority} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{shortDate(investor.addedAt)}</td>
                  <td className="px-3 py-3">
                    <Link href={`/investors/${investor.id}`} className="font-medium text-blue-600 hover:underline">
                      {investor.fullName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{investor.phone || "—"}</td>
                  <td className="px-3 py-3">{investor.email || "—"}</td>
                  <td className="px-3 py-3">{investor.investorType || "—"}</td>
                  <td className="px-3 py-3">{investor.preferredCounties.join(", ") || "—"}</td>
                  <td className="px-3 py-3">{investor.preferredCities.join(", ") || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{priceRange(investor.priceMin, investor.priceMax)}</td>
                  <td className="px-3 py-3">{investor.funding || "—"}</td>
                  <td className="px-3 py-3">
                    {investor.crmLink ? (
                      <a href={investor.crmLink} className="text-blue-600 hover:underline" target="_blank">
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs truncate px-3 py-3" title={investor.notes}>
                    {investor.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CreateModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function PrioritySelect({ id, priority }: { id: string; priority: Priority }) {
  const router = useRouter();
  const [value, setValue] = useState(priority);
  return (
    <select
      aria-label="Priority"
      value={value}
      className={`rounded-lg border-0 px-2 py-1 text-sm font-medium capitalize ${priorityClass[value]}`}
      onChange={async (event) => {
        const next = event.target.value as Priority;
        setValue(next);
        const result = await updateInvestorPriority(id, next);
        if (!result.ok) setValue(priority);
        router.refresh();
      }}
    >
      {PRIORITIES.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<InvestorInput[]>([blankInvestor()]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"form" | "csv">("form");
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const current = drafts[index] ?? blankInvestor();

  function close() {
    setDrafts([blankInvestor()]);
    setIndex(0);
    setCsv("");
    setMessage("");
    onClose();
  }

  return (
    <Modal open={open} title="Add investors" onClose={close}>
      <div className="mb-4 flex gap-2">
        <button type="button" className={`rounded-lg px-3 py-1.5 text-sm ${mode === "form" ? "bg-blue-50 text-blue-700" : "text-slate-500"}`} onClick={() => setMode("form")}>
          Enter records
        </button>
        <button type="button" className={`rounded-lg px-3 py-1.5 text-sm ${mode === "csv" ? "bg-blue-50 text-blue-700" : "text-slate-500"}`} onClick={() => setMode("csv")}>
          Import CSV
        </button>
      </div>
      {mode === "form" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {index + 1} of {drafts.length}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous investor" className="rounded-lg border p-2" onClick={() => setIndex((value) => Math.max(0, value - 1))}>
                <ChevronLeft size={16} />
              </button>
              <select aria-label="Choose an investor" className="rounded-lg border px-2 py-2 text-sm" value={index} onChange={(event) => setIndex(Number(event.target.value))}>
                {drafts.map((draft, draftIndex) => (
                  <option key={draftIndex} value={draftIndex}>
                    {draftIndex + 1}. {draft.fullName || "New investor"}
                  </option>
                ))}
              </select>
              <button type="button" aria-label="Next investor" className="rounded-lg border p-2" onClick={() => setIndex((value) => Math.min(drafts.length - 1, value + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <InvestorFields
            value={current}
            onChange={(next) => setDrafts((items) => items.map((item, itemIndex) => (itemIndex === index ? next : item)))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setDrafts((items) => [...items, blankInvestor()]);
                setIndex(drafts.length);
              }}
            >
              Add another
            </Button>
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                const result = await saveInvestors(drafts);
                setPending(false);
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                router.refresh();
                close();
              }}
            >
              {pending ? "Saving…" : "Save investors"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Columns: Full Name, Phone, Email, Investor Type, Preferred Counties, Preferred Cities, Price Min, Price Max, Funding, CRM link, Notes, Priority.
          </p>
          <textarea
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder="Full Name,Email,Preferred Cities,Price Min,Price Max"
            className="min-h-40 w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setCsv(await file.text());
            }}
          />
          <Button
            disabled={pending || !csv.trim()}
            onClick={async () => {
              setPending(true);
              const result = await importInvestorCsv(csv);
              setPending(false);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              router.refresh();
              close();
            }}
          >
            Import {pending ? "…" : "investors"}
          </Button>
        </div>
      )}
      {message ? <p className="mt-3 text-sm text-rose-600">{message}</p> : null}
    </Modal>
  );
}

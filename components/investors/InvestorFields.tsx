"use client";

import { useState } from "react";
import { PRIORITIES } from "@/lib/constants";
import { inputClass } from "@/components/ui";
import type { InvestorInput, Priority } from "@/lib/types";

export function InvestorFields({
  value,
  onChange,
}: {
  value: InvestorInput;
  onChange: (next: InvestorInput) => void;
}) {
  function set<K extends keyof InvestorInput>(key: K, next: InvestorInput[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="md:col-span-2 text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Full name</span>
        <input className={inputClass} value={value.fullName} onChange={(event) => set("fullName", event.target.value)} />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Phone</span>
        <input className={inputClass} value={value.phone} onChange={(event) => set("phone", event.target.value)} />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Email</span>
        <input className={inputClass} value={value.email} onChange={(event) => set("email", event.target.value)} />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Investor type</span>
        <input className={inputClass} value={value.investorType} onChange={(event) => set("investorType", event.target.value)} />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Priority</span>
        <select className={inputClass} value={value.priority} onChange={(event) => set("priority", event.target.value as Priority)}>
          {PRIORITIES.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>
      <ChipField label="Preferred counties" values={value.preferredCounties} onChange={(preferredCounties) => set("preferredCounties", preferredCounties)} />
      <ChipField label="Preferred cities" values={value.preferredCities} onChange={(preferredCities) => set("preferredCities", preferredCities)} />
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Price min</span>
        <input
          className={inputClass}
          inputMode="decimal"
          value={value.priceMin ?? ""}
          onChange={(event) => set("priceMin", event.target.value ? Number(event.target.value) : null)}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Price max</span>
        <input
          className={inputClass}
          inputMode="decimal"
          value={value.priceMax ?? ""}
          onChange={(event) => set("priceMax", event.target.value ? Number(event.target.value) : null)}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Funding</span>
        <input className={inputClass} value={value.funding} onChange={(event) => set("funding", event.target.value)} />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">CRM link</span>
        <input className={inputClass} value={value.crmLink} onChange={(event) => set("crmLink", event.target.value)} />
      </label>
      <label className="md:col-span-2 text-sm">
        <span className="mb-1.5 block font-medium text-slate-600">Notes</span>
        <textarea className={`${inputClass} min-h-24`} value={value.notes} onChange={(event) => set("notes", event.target.value)} />
      </label>
    </div>
  );
}

function ChipField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(/[,|]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    parts.forEach((part) => {
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) next.push(part);
    });
    onChange(next);
    setDraft("");
  }

  return (
    <label className="text-sm">
      <span className="mb-1.5 block font-medium text-slate-600">{label}</span>
      <div className={`${inputClass} flex min-h-10 flex-wrap items-center gap-2`}>
        {values.map((chip) => (
          <button
            type="button"
            key={chip}
            onClick={() => onChange(values.filter((item) => item !== chip))}
            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {chip} ×
          </button>
        ))}
        <input
          value={draft}
          placeholder="Type and press Enter"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => add(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
          }}
          className="min-w-32 flex-1 bg-transparent outline-none"
        />
      </div>
    </label>
  );
}

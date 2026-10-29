"use client";

import { blankComp } from "@/lib/blank";
import { inputClass } from "@/components/ui";
import type { CompInput } from "@/lib/types";

export type EditableComp = CompInput & { key: string };

export function CompEditor({
  comps,
  onChange,
}: {
  comps: EditableComp[];
  onChange: (comps: EditableComp[]) => void;
}) {
  function update(key: string, patch: Partial<CompInput>) {
    onChange(comps.map((comp) => (comp.key === key ? { ...comp, ...patch } : comp)));
  }

  return (
    <div className="space-y-4">
      {comps.map((comp, index) => (
        <div key={comp.key} className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Comp {index + 1}</h3>
            <button type="button" className="text-sm text-rose-600" onClick={() => onChange(comps.filter((item) => item.key !== comp.key))}>
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="md:col-span-4 text-sm">
              Address
              <input className={`${inputClass} mt-1`} value={comp.address} onChange={(event) => update(comp.key, { address: event.target.value })} />
            </label>
            <Text label="City" value={comp.city} onChange={(city) => update(comp.key, { city })} />
            <Text label="State" value={comp.state} onChange={(state) => update(comp.key, { state })} />
            <Text label="Zip" value={comp.zip} onChange={(zip) => update(comp.key, { zip })} />
            <Num label="Sale price" value={comp.salePrice} onChange={(salePrice) => update(comp.key, { salePrice })} />
            <Num label="Sqft" value={comp.sqft} onChange={(sqft) => update(comp.key, { sqft })} />
            <Num label="Beds" value={comp.beds} onChange={(beds) => update(comp.key, { beds })} />
            <Num label="Baths" value={comp.baths} onChange={(baths) => update(comp.key, { baths })} />
            <Text label="Sold date" value={comp.soldDate} onChange={(soldDate) => update(comp.key, { soldDate })} />
            <Num label="DOM" value={comp.dom} onChange={(dom) => update(comp.key, { dom })} />
            <Num label="Stories" value={comp.stories} onChange={(stories) => update(comp.key, { stories })} />
            <Text label="Condition" value={comp.condition} onChange={(condition) => update(comp.key, { condition })} />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        onClick={() => onChange([...comps, { ...blankComp(), key: crypto.randomUUID() }])}
      >
        Add comp
      </button>
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input className={`${inputClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        className={`${inputClass} mt-1`}
        inputMode="decimal"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
      />
    </label>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendCampaignAction } from "@/lib/actions/campaigns";
import { money } from "@/lib/format";
import { matchInvestors } from "@/lib/matching";
import type { Investor, MatchPage } from "@/lib/types";
import { Button, inputClass } from "@/components/ui";

export function Composer({
  pages,
  investors,
  preselectAll,
}: {
  pages: MatchPage[];
  investors: Investor[];
  preselectAll: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(() => (preselectAll ? pages.map((page) => page.id) : []));
  const [subject, setSubject] = useState("Properties that match your buying criteria");
  const [body, setBody] = useState(
    "Here are the properties that match your buying criteria. Open a link to review the underwriting and submit an offer.",
  );
  const [when, setWhen] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const chosen = useMemo(() => pages.filter((page) => selected.includes(page.id)), [pages, selected]);
  const preview = useMemo(() => (previewing ? matchInvestors(investors, chosen) : null), [previewing, investors, chosen]);

  function toggle(id: string) {
    setPreviewing(false);
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function send(schedule: boolean) {
    setPending(true);
    setMessage("");
    const result = await sendCampaignAction({
      subject,
      body,
      landingPageIds: selected,
      scheduledAt: schedule && when ? new Date(when).toISOString() : null,
    });
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      if ("id" in result && result.id) router.push(`/newsletter/${result.id}`);
      return;
    }
    router.push(`/newsletter/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Create newsletter</h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose landing pages once. Each investor receives only the pages that match their cities, counties, and price range.
      </p>
      <div className="mt-5 space-y-3">
        {pages.length === 0 ? <p className="text-sm text-slate-500">Publish a landing page before sending a newsletter.</p> : null}
        {pages.map((page) => (
          <label key={page.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <input type="checkbox" className="mt-1" checked={selected.includes(page.id)} onChange={() => toggle(page.id)} />
            <span>
              <span className="block font-medium">{page.street || "Untitled property"}</span>
              <span className="text-sm text-slate-500">
                {[page.city, page.county, page.state].filter(Boolean).join(", ")} · {money(page.listPrice)}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium">
          Subject
          <input className={`${inputClass} mt-1`} value={subject} onChange={(event) => setSubject(event.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Email body
          <textarea className={`${inputClass} mt-1 min-h-28`} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Send later
          <input type="datetime-local" className={`${inputClass} mt-1`} value={when} onChange={(event) => setWhen(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setPreviewing(true)} disabled={selected.length === 0}>
          Preview
        </Button>
        <Button disabled={pending || selected.length === 0} onClick={() => void send(false)}>
          Send now
        </Button>
        <Button variant="secondary" disabled={pending || !when || selected.length === 0} onClick={() => void send(true)}>
          Schedule
        </Button>
      </div>
      {preview ? (
        <div className="mt-6 space-y-4">
          <h2 className="font-semibold">Who receives which pages</h2>
          {preview.recipients.length === 0 ? <p className="text-sm text-slate-500">No investors with an email match this selection.</p> : null}
          {preview.recipients.map((recipient) => (
            <div key={recipient.investor.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium">
                {recipient.investor.fullName} · {recipient.investor.email}
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {recipient.pages.map((page) => (
                  <li key={page.id}>
                    {page.street || "Untitled"} — {money(page.listPrice)}
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-800">{subject}</p>
                <p className="mt-2 whitespace-pre-wrap">{body}</p>
              </div>
            </div>
          ))}
          {preview.skippedNoEmail.length > 0 ? (
            <p className="text-sm text-amber-700">
              Matched but missing an email: {preview.skippedNoEmail.map((item) => item.investor.fullName).join(", ")}
            </p>
          ) : null}
          {preview.unmatchedPages.length > 0 ? (
            <p className="text-sm text-amber-700">
              No investor matched: {preview.unmatchedPages.map((page) => page.street || "Untitled").join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-rose-600">{message}</p> : null}
    </div>
  );
}

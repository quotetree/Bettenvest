"use client";

import { useEffect, useState } from "react";
import { createOfferAction } from "@/lib/actions/landing";
import { fileHref } from "@/lib/format";
import { Button, inputClass } from "@/components/ui";

export function ViewTracker({ slug, token }: { slug: string; token: string }) {
  useEffect(() => {
    const guard = window as Window & { __bvViews?: Set<string> };
    guard.__bvViews ??= new Set();
    const guardKey = `${slug}:${token}`;
    if (guard.__bvViews.has(guardKey)) return;
    guard.__bvViews.add(guardKey);
    const storageKey = "bv-visitor";
    const existing = window.localStorage.getItem(storageKey);
    const visitorKey = existing || crypto.randomUUID();
    if (!existing) window.localStorage.setItem(storageKey, visitorKey);
    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, visitorKey }),
    });
  }, [slug, token]);
  return null;
}

export function PhotoGrid({ photos, alt }: { photos: string[]; alt: string }) {
  const [open, setOpen] = useState(false);
  const hrefs = photos.map((photo) => fileHref("property-photos", photo));
  if (!hrefs.length) {
    return <div className="grid h-72 place-items-center rounded-2xl bg-slate-100 text-slate-400">Photos will appear here</div>;
  }
  return (
    <div className="relative">
      <div className={`grid h-[280px] gap-2 sm:h-[420px] ${hrefs.length > 1 ? "grid-cols-2 sm:grid-cols-4 sm:grid-rows-2" : "grid-cols-1"}`}>
        <img src={hrefs[0]} alt={alt} className={`h-full w-full rounded-2xl object-cover ${hrefs.length > 1 ? "sm:col-span-2 sm:row-span-2" : ""}`} />
        {hrefs.slice(1, 5).map((href) => (
          <img key={href} src={href} alt="" className="hidden h-full w-full rounded-xl object-cover sm:block" />
        ))}
      </div>
      {hrefs.length > 1 ? (
        <button type="button" onClick={() => setOpen(true)} className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-medium shadow">
          See all {hrefs.length} photos
        </button>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-6" onClick={() => setOpen(false)}>
          <div className="mx-auto grid max-w-4xl gap-3">
            {hrefs.map((href) => (
              <img key={href} src={href} alt="" className="w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ViewContact({ phone, email }: { phone: string; email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700">
        View contact
      </button>
      {open ? (
        <div className="mt-3 text-sm text-slate-600">
          <div>{phone || "No phone on file"}</div>
          <div>{email || "No email on file"}</div>
        </div>
      ) : null}
    </div>
  );
}

export function OfferBox({
  landingPageId,
  token,
  defaults,
}: {
  landingPageId: string;
  token: string;
  defaults: { name: string; phone: string; email: string };
}) {
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [email, setEmail] = useState(defaults.email);
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (done) {
    return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Your offer was submitted.</p>;
  }

  return (
    <form
      id="offer-form"
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await createOfferAction({
          landingPageId,
          investorName: name,
          amount: amount ? Number(amount) : null,
          phone,
          email,
          terms,
          notes: "",
          token,
        });
        setPending(false);
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setDone(true);
      }}
    >
      <input className={inputClass} placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required />
      <input className={inputClass} placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <input className={inputClass} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <input className={inputClass} placeholder="Offer amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
      <textarea className={`${inputClass} min-h-24`} placeholder="Terms" value={terms} onChange={(event) => setTerms(event.target.value)} />
      {message ? <p className="text-sm text-rose-600">{message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Make an Offer"}
      </Button>
    </form>
  );
}

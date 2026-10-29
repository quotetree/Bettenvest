import { notFound } from "next/navigation";
import { Bath, BedDouble, Calendar, MapPin, Ruler } from "lucide-react";
import { OfferBox, PhotoGrid, ViewContact, ViewTracker } from "@/components/public/PublicWidgets";
import { DISCLAIMER, NEXT_STEPS, TIME_SENSITIVE } from "@/lib/constants";
import { bedBath, initials, money, plainNumber, priceRange, soldDate } from "@/lib/format";
import { store } from "@/lib/store";
import { REHAB_LABEL } from "@/lib/underwriting/mao";

export const dynamic = "force-dynamic";

export default async function PublicLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { slug } = await params;
  const { r: token = "" } = await searchParams;
  const page = await store.getLandingPageBySlug(slug);
  if (!page) notFound();
  const deal = page.deal;
  let defaults = { name: "", phone: "", email: "" };
  if (token) {
    const recipient = await store.getRecipientByToken(token);
    if (recipient && recipient.matchedLandingPageIds.includes(page.id)) {
      const investor = await store.getInvestor(recipient.investorId);
      if (investor) defaults = { name: investor.fullName, phone: investor.phone, email: investor.email };
    }
  }
  const place = [deal.city, deal.state, deal.zip].filter(Boolean).join(", ");
  const lot = [deal.lotSqft ? `${plainNumber(deal.lotSqft)} sqft` : "", deal.garage].filter(Boolean).join(" / ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <ViewTracker slug={slug} token={token} />
      <PhotoGrid photos={deal.photos} alt={deal.street || "Property"} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <h1 className="flex items-start gap-2 text-2xl font-semibold sm:text-3xl">
            <MapPin className="mt-1 shrink-0 text-blue-600" size={22} />
            <span>
              {deal.street || "Property"}
              {place ? <span className="text-slate-700">, {place}</span> : null}
            </span>
          </h1>
          <p className="mt-2 text-slate-500">{deal.propertyType || "Property"}</p>
          <div className="mt-4">
            <div className="text-3xl font-semibold">{money(deal.listPrice)}</div>
            <div className="text-sm text-slate-500">Starting price</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <BedDouble size={16} /> {deal.beds ?? "—"} Bedrooms
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath size={16} /> {deal.baths ?? "—"} Baths
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler size={16} /> {plainNumber(deal.livingSqft)} Sqft
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={16} /> Built {deal.yearBuilt ?? "—"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-sky-50 p-4 sm:grid-cols-2">
            <div>
              <div className="text-lg font-semibold">{priceRange(page.arvMin, page.arvMax)}</div>
              <div className="text-sm text-slate-500">After-repair value</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{priceRange(page.rentMin, page.rentMax)}</div>
              <div className="text-sm text-slate-500">Monthly rent</div>
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Let&apos;s take the next step</h2>
            <p className="mt-1 text-sm text-slate-500">Make an offer directly on this page to lock down this deal.</p>
            <div className="mt-4">
              <OfferBox landingPageId={page.id} token={token} defaults={defaults} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-semibold">
                {initials(deal.agentName, "AG")}
              </span>
              <div>
                <div className="font-medium">{deal.agentName || "Listing agent"}</div>
                <div className="text-sm text-slate-500">{deal.agentOffice || "Listing office"}</div>
              </div>
            </div>
            <ViewContact phone={deal.agentPhone} email={deal.agentEmail} />
          </div>
        </aside>
      </div>

      <section className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="text-2xl font-semibold">About This Deal</h2>
        <h3 className="mt-6 text-xl font-semibold">Underwriting</h3>
        <dl className="mt-4 space-y-3 text-sm sm:text-base">
          <div>
            <dt className="inline font-semibold">Asking Price: </dt>
            <dd className="inline">{money(deal.listPrice)}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">ARV Range: </dt>
            <dd className="inline">{priceRange(page.arvMin, page.arvMax)}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Base Repair Estimate: </dt>
            <dd className="inline">
              {money(page.repairEstimate)}
              {page.rehabCategory ? ` (${REHAB_LABEL[page.rehabCategory]})` : ""}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold">MAO Range (80% of ARV – Repairs): </dt>
            <dd className="inline">{priceRange(page.maoMin, page.maoMax)}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Lot Size / Garage: </dt>
            <dd className="inline">{lot || "—"}</dd>
          </div>
        </dl>
        {page.narrative ? <p className="mt-4 max-w-3xl text-slate-600">{page.narrative}</p> : null}
        {page.rehabReason ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{page.rehabReason}</p> : null}

        <h3 className="mt-8 text-xl font-semibold">Notes From Listing Agent</h3>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{deal.agentNotes || "No listing-agent notes were added."}</p>

        <h3 className="mt-8 text-xl font-semibold">Comparable Properties</h3>
        {page.comps.length === 0 ? (
          <p className="mt-3 text-slate-500">No comparable sales were attached.</p>
        ) : (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
            {page.comps.map((comp) => (
              <li key={comp.id}>
                {[comp.address, [comp.city, comp.state, comp.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")} –{" "}
                <strong>{money(comp.salePrice)}</strong>: {plainNumber(comp.sqft)} sqft | {bedBath(comp.beds, comp.baths)} bed/bath |{" "}
                {soldDate(comp.soldDate)}
              </li>
            ))}
          </ol>
        )}

        <h3 className="mt-8 text-xl font-semibold">Next Steps</h3>
        <ol className="mt-4 list-decimal space-y-3 pl-5">
          {NEXT_STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> – {step.body}
            </li>
          ))}
        </ol>

        <h3 className="mt-10 text-xl font-semibold">Important Disclaimer</h3>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{DISCLAIMER}</p>
        <p className="mt-4 font-semibold">{TIME_SENSITIVE}</p>
      </section>
    </main>
  );
}

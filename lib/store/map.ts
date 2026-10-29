import { WORKSPACE_ID } from "@/lib/workspace";
import type {
  ActivityEvent,
  Campaign,
  Comp,
  CompInput,
  Deal,
  DealInput,
  Investor,
  InvestorInput,
  LandingPage,
  Offer,
  PageView,
  PipelineStage,
  Recipient,
  RehabCategory,
  UnderwritingPrompt,
  Workspace,
} from "@/lib/types";
import type { PipelineRow } from "@/lib/store/model";

type Row = Record<string, unknown>;

function num(row: Row, key: string): number | null {
  const value = row[key];
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function str(row: Row, key: string): string {
  const value = row[key];
  return value == null ? "" : String(value);
}

function iso(row: Row, key: string): string {
  const value = row[key];
  if (!value) return new Date().toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function nullableIso(row: Row, key: string): string | null {
  const value = row[key];
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function strList(row: Row, key: string): string[] {
  const value = row[key];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function mapWorkspace(row: Row): Workspace {
  return {
    id: str(row, "id"),
    name: str(row, "name") || "Bettenvest",
    ownerInitials: str(row, "owner_initials") || "SB",
  };
}

export function mapPrompt(row: Row): UnderwritingPrompt {
  return {
    key: str(row, "key") as UnderwritingPrompt["key"],
    title: str(row, "title"),
    body: str(row, "body"),
    updatedAt: iso(row, "updated_at"),
  };
}

export function mapDeal(row: Row): Deal {
  return {
    id: str(row, "id"),
    status: str(row, "status") as Deal["status"],
    uploadedAt: iso(row, "uploaded_at"),
    listingId: str(row, "listing_id"),
    street: str(row, "street"),
    city: str(row, "city"),
    state: str(row, "state"),
    zip: str(row, "zip"),
    county: str(row, "county"),
    listPrice: num(row, "list_price"),
    beds: num(row, "beds"),
    baths: num(row, "baths"),
    livingSqft: num(row, "living_sqft"),
    lotSqft: num(row, "lot_sqft"),
    stories: num(row, "stories"),
    yearBuilt: num(row, "year_built"),
    garage: str(row, "garage"),
    daysOnMarket: num(row, "days_on_market"),
    cdom: num(row, "cdom"),
    condition: str(row, "condition"),
    propertyType: str(row, "property_type"),
    agentName: str(row, "agent_name"),
    agentPhone: str(row, "agent_phone"),
    agentOffice: str(row, "agent_office"),
    agentEmail: str(row, "agent_email"),
    agentNotes: str(row, "agent_notes"),
    sourcePdfPath: str(row, "source_pdf_path") || null,
    photos: strList(row, "photos"),
    extracted: row.extracted ?? null,
    updatedAt: iso(row, "updated_at"),
  };
}

const dealColumns: Record<keyof DealInput, string> = {
  status: "status",
  listingId: "listing_id",
  street: "street",
  city: "city",
  state: "state",
  zip: "zip",
  county: "county",
  listPrice: "list_price",
  beds: "beds",
  baths: "baths",
  livingSqft: "living_sqft",
  lotSqft: "lot_sqft",
  stories: "stories",
  yearBuilt: "year_built",
  garage: "garage",
  daysOnMarket: "days_on_market",
  cdom: "cdom",
  condition: "condition",
  propertyType: "property_type",
  agentName: "agent_name",
  agentPhone: "agent_phone",
  agentOffice: "agent_office",
  agentEmail: "agent_email",
  agentNotes: "agent_notes",
  sourcePdfPath: "source_pdf_path",
  photos: "photos",
  extracted: "extracted",
};

export function dealRow(input: DealInput, id: string) {
  const timestamp = new Date().toISOString();
  return {
    id,
    workspace_id: WORKSPACE_ID,
    uploaded_at: timestamp,
    updated_at: timestamp,
    ...dealPatch(input),
  };
}

export function dealPatch(patch: Partial<DealInput>) {
  const row: Row = { updated_at: new Date().toISOString() };
  (Object.keys(dealColumns) as (keyof DealInput)[]).forEach((key) => {
    if (key in patch) row[dealColumns[key]] = patch[key] ?? null;
  });
  return row;
}

export function mapInvestor(row: Row): Investor {
  return {
    id: str(row, "id"),
    priority: (str(row, "priority") || "warm") as Investor["priority"],
    addedAt: iso(row, "added_at"),
    fullName: str(row, "full_name"),
    phone: str(row, "phone"),
    email: str(row, "email"),
    investorType: str(row, "investor_type"),
    preferredCounties: strList(row, "preferred_counties"),
    preferredCities: strList(row, "preferred_cities"),
    priceMin: num(row, "price_min"),
    priceMax: num(row, "price_max"),
    funding: str(row, "funding"),
    crmLink: str(row, "crm_link"),
    notes: str(row, "notes"),
    updatedAt: iso(row, "updated_at"),
  };
}

export function investorRow(input: InvestorInput, id: string) {
  const timestamp = new Date().toISOString();
  return {
    id,
    workspace_id: WORKSPACE_ID,
    priority: input.priority,
    added_at: timestamp,
    updated_at: timestamp,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    investor_type: input.investorType,
    preferred_counties: input.preferredCounties,
    preferred_cities: input.preferredCities,
    price_min: input.priceMin,
    price_max: input.priceMax,
    funding: input.funding,
    crm_link: input.crmLink,
    notes: input.notes,
  };
}

export function investorPatch(patch: Partial<InvestorInput>) {
  const columns: Record<keyof InvestorInput, string> = {
    priority: "priority",
    fullName: "full_name",
    phone: "phone",
    email: "email",
    investorType: "investor_type",
    preferredCounties: "preferred_counties",
    preferredCities: "preferred_cities",
    priceMin: "price_min",
    priceMax: "price_max",
    funding: "funding",
    crmLink: "crm_link",
    notes: "notes",
  };
  const row: Row = { updated_at: new Date().toISOString() };
  (Object.keys(columns) as (keyof InvestorInput)[]).forEach((key) => {
    if (key in patch) row[columns[key]] = patch[key] ?? null;
  });
  return row;
}

export function mapLanding(row: Row): LandingPage {
  const category = str(row, "rehab_category");
  return {
    id: str(row, "id"),
    dealId: str(row, "deal_id"),
    slug: str(row, "slug"),
    status: (str(row, "status") || "active") as LandingPage["status"],
    arvMin: num(row, "arv_min"),
    arvMax: num(row, "arv_max"),
    rehabCategory: (category || null) as RehabCategory | null,
    rehabReason: str(row, "rehab_reason"),
    repairEstimate: num(row, "repair_estimate"),
    maoMin: num(row, "mao_min"),
    maoMax: num(row, "mao_max"),
    rentMin: num(row, "rent_min"),
    rentMax: num(row, "rent_max"),
    narrative: str(row, "narrative"),
    publishedAt: nullableIso(row, "published_at"),
    createdAt: iso(row, "created_at"),
    updatedAt: iso(row, "updated_at"),
  };
}

export function mapComp(row: Row): Comp {
  const sold = str(row, "sold_date");
  return {
    id: str(row, "id"),
    landingPageId: str(row, "landing_page_id"),
    address: str(row, "address"),
    city: str(row, "city"),
    state: str(row, "state"),
    zip: str(row, "zip"),
    salePrice: num(row, "sale_price"),
    sqft: num(row, "sqft"),
    beds: num(row, "beds"),
    baths: num(row, "baths"),
    soldDate: sold ? sold.slice(0, 10) : "",
    dom: num(row, "dom"),
    condition: str(row, "condition"),
    stories: num(row, "stories"),
    sourcePdfPath: str(row, "source_pdf_path") || null,
    position: num(row, "position") ?? 0,
  };
}

export function compRow(comp: CompInput, landingPageId: string, position: number) {
  return {
    id: crypto.randomUUID(),
    landing_page_id: landingPageId,
    address: comp.address,
    city: comp.city,
    state: comp.state,
    zip: comp.zip,
    sale_price: comp.salePrice,
    sqft: comp.sqft,
    beds: comp.beds,
    baths: comp.baths,
    sold_date: comp.soldDate || null,
    dom: comp.dom,
    condition: comp.condition,
    stories: comp.stories,
    source_pdf_path: comp.sourcePdfPath,
    position,
  };
}

export function mapPipeline(row: Row): PipelineRow {
  return {
    id: str(row, "id"),
    landingPageId: str(row, "landing_page_id"),
    stage: str(row, "stage") as PipelineStage,
    position: num(row, "position") ?? 0,
  };
}

export function mapOffer(row: Row): Offer {
  return {
    id: str(row, "id"),
    landingPageId: str(row, "landing_page_id"),
    investorId: str(row, "investor_id") || null,
    investorName: str(row, "investor_name"),
    amount: num(row, "amount"),
    terms: str(row, "terms"),
    phone: str(row, "phone"),
    email: str(row, "email"),
    notes: str(row, "notes"),
    createdAt: iso(row, "created_at"),
  };
}

export function mapView(row: Row): PageView {
  return {
    id: str(row, "id"),
    landingPageId: str(row, "landing_page_id"),
    investorId: str(row, "investor_id") || null,
    visitorKey: str(row, "visitor_key"),
    createdAt: iso(row, "created_at"),
  };
}

export function mapCampaign(row: Row): Campaign {
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    subject: str(row, "subject"),
    body: str(row, "body"),
    status: str(row, "status") as Campaign["status"],
    scheduledAt: nullableIso(row, "scheduled_at"),
    sentAt: nullableIso(row, "sent_at"),
    deliveryNote: str(row, "delivery_note") || null,
    createdAt: iso(row, "created_at"),
  };
}

export function mapRecipient(row: Row): Recipient {
  return {
    id: str(row, "id"),
    campaignId: str(row, "campaign_id"),
    investorId: str(row, "investor_id"),
    token: str(row, "token"),
    matchedLandingPageIds: strList(row, "matched_landing_page_ids"),
    sentAt: nullableIso(row, "sent_at"),
  };
}

export function mapEvent(row: Row): ActivityEvent {
  return {
    id: str(row, "id"),
    type: str(row, "type") as ActivityEvent["type"],
    title: str(row, "title"),
    body: str(row, "body"),
    refType: str(row, "ref_type"),
    refId: str(row, "ref_id"),
    createdAt: iso(row, "created_at"),
  };
}

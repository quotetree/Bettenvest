import "server-only";

import { blankComp, blankDeal } from "@/lib/blank";
import { CONDITIONS, PROPERTY_TYPES } from "@/lib/constants";
import type { CompInput, DealInput } from "@/lib/types";
import { jsonCompletion } from "@/lib/ai/openai";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function integer(value: unknown): number | null {
  const parsed = number(value);
  return parsed == null ? null : Math.round(parsed);
}

function choice(value: string, options: string[]): string {
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (
    options.find((option) => option.toLowerCase().replace(/[_-]+/g, " ") === normalized) || value
  );
}

const MLS_SYSTEM = `You extract listing facts from an MLS sheet. Use only facts present in the text. Use null for unknown numbers and "" for unknown text. Do not invent values.
Return JSON with keys: listing_id, street, city, state, zip, county, list_price, beds, baths, living_sqft, lot_sqft, stories, year_built, garage, days_on_market, cdom, condition, property_type, agent_name, agent_phone, agent_office, agent_email, agent_notes.
condition should be one of: Needs updating, Cosmetic, Average, Good, Excellent, Tear down, or "".
property_type should be one of: Single-family, Condo, Townhouse, Multi-family, Land, or "".
Prices are dollars. State should be a 2-letter code when the sheet gives one.`;

export async function extractMls(pdfText: string): Promise<Partial<DealInput> | null> {
  if (!pdfText.trim()) return null;
  const parsed = await jsonCompletion(MLS_SYSTEM, pdfText.slice(0, 24000));
  if (!parsed) return null;
  const condition = choice(text(parsed.condition), CONDITIONS);
  const propertyType = choice(text(parsed.property_type), PROPERTY_TYPES);
  const state = text(parsed.state);
  return {
    listingId: text(parsed.listing_id),
    street: text(parsed.street),
    city: text(parsed.city),
    state: state.length === 2 ? state.toUpperCase() : state,
    zip: text(parsed.zip),
    county: text(parsed.county),
    listPrice: number(parsed.list_price),
    beds: number(parsed.beds),
    baths: number(parsed.baths),
    livingSqft: number(parsed.living_sqft),
    lotSqft: number(parsed.lot_sqft),
    stories: number(parsed.stories),
    yearBuilt: integer(parsed.year_built),
    garage: text(parsed.garage),
    daysOnMarket: integer(parsed.days_on_market),
    cdom: integer(parsed.cdom),
    condition,
    propertyType,
    agentName: text(parsed.agent_name),
    agentPhone: text(parsed.agent_phone),
    agentOffice: text(parsed.agent_office),
    agentEmail: text(parsed.agent_email),
    agentNotes: text(parsed.agent_notes),
    extracted: parsed,
  };
}

export function mlsDeal(pdfText: string, extracted: Partial<DealInput> | null, sourcePdfPath: string): DealInput {
  return blankDeal({
    ...extracted,
    sourcePdfPath,
    extracted: extracted?.extracted ?? null,
    photos: [],
  });
}

const COMP_SYSTEM = `You extract SOLD comparable properties from an MLS sheet or comp report. Return every sold comp the text supports.
Return JSON: {"comps":[{"address":"","city":"","state":"","zip":"","sale_price":null,"sqft":null,"beds":null,"baths":null,"sold_date":"","dom":null,"condition":"","stories":null}]}
sold_date as YYYY-MM-DD when possible. Use null when a number is unknown and "" when text is unknown.`;

function mapComp(value: unknown, sourcePdfPath: string | null): CompInput | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const sold = text(row.sold_date);
  return blankComp({
    address: text(row.address),
    city: text(row.city),
    state: text(row.state).length === 2 ? text(row.state).toUpperCase() : text(row.state),
    zip: text(row.zip),
    salePrice: number(row.sale_price),
    sqft: number(row.sqft),
    beds: number(row.beds),
    baths: number(row.baths),
    soldDate: /^\d{4}-\d{2}-\d{2}/.test(sold) ? sold.slice(0, 10) : "",
    dom: integer(row.dom),
    condition: text(row.condition),
    stories: number(row.stories),
    sourcePdfPath,
  });
}

export async function extractComps(pdfText: string, sourcePdfPath: string | null): Promise<CompInput[] | null> {
  if (!pdfText.trim()) return null;
  const parsed = await jsonCompletion(COMP_SYSTEM, pdfText.slice(0, 24000));
  if (!parsed) return null;
  const list = Array.isArray(parsed.comps) ? parsed.comps : [parsed];
  const comps = list
    .map((item) => mapComp(item, sourcePdfPath))
    .filter((comp): comp is CompInput => Boolean(comp && (comp.address || comp.salePrice)));
  return comps;
}

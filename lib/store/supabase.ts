import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultPrompts, PROMPT_TITLES } from "@/lib/prompts";
import type {
  CreateCampaignInput,
  CreateLandingInput,
  EventInput,
  OfferInput,
  Store,
  UpdateLandingInput,
  ViewInput,
} from "@/lib/store/api";
import {
  compRow,
  dealPatch,
  dealRow,
  investorPatch,
  investorRow,
  mapCampaign,
  mapComp,
  mapDeal,
  mapEvent,
  mapInvestor,
  mapLanding,
  mapOffer,
  mapPipeline,
  mapPrompt,
  mapRecipient,
  mapView,
  mapWorkspace,
} from "@/lib/store/map";
import type { DB } from "@/lib/store/model";
import {
  activityFor,
  campaignDetail,
  landingBySlug,
  landingDetail,
  listCampaigns,
  listDeals,
  listInvestors,
  listLandingPages,
  listPipeline,
  movePipelineRows,
} from "@/lib/store/select";
import { getServiceClient } from "@/lib/supabase/client";
import type { CompInput, DealInput, InvestorInput, PromptKey } from "@/lib/types";
import { WORKSPACE_ID } from "@/lib/workspace";

type Result<T> = { data: T; error: { message: string } | null };

function sb(): SupabaseClient {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

function check<T>(result: Result<T>, label: string): T {
  if (result.error) {
    throw new Error(
      `${label}: ${result.error.message}. Run supabase/migrations/0001_init.sql if this table is missing.`,
    );
  }
  return result.data;
}

let ready: Promise<void> | null = null;

function ensure() {
  if (!ready) {
    ready = seedWorkspace().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function seedWorkspace() {
  const client = sb();
  const existing = await client.from("workspaces").select("id").eq("id", WORKSPACE_ID).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) {
    const inserted = await client.from("workspaces").insert({
      id: WORKSPACE_ID,
      name: "Bettenvest",
      owner_initials: "SB",
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }
  const prompts = await client
    .from("underwriting_prompts")
    .select("key")
    .eq("workspace_id", WORKSPACE_ID);
  if (prompts.error) throw new Error(prompts.error.message);
  if (!prompts.data?.length) {
    const seeded = await client.from("underwriting_prompts").insert(
      defaultPrompts().map((prompt) => ({
        workspace_id: WORKSPACE_ID,
        key: prompt.key,
        title: prompt.title,
        body: prompt.body,
        updated_at: prompt.updatedAt,
      })),
    );
    if (seeded.error) throw new Error(seeded.error.message);
  }
}

async function loadDb(): Promise<DB> {
  await ensure();
  const client = sb();
  const [
    workspace,
    prompts,
    deals,
    investors,
    landingPages,
    comps,
    pipeline,
    offers,
    views,
    campaigns,
    campaignPages,
    recipients,
    events,
  ] = await Promise.all([
    client.from("workspaces").select("*").eq("id", WORKSPACE_ID).single(),
    client.from("underwriting_prompts").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("deals").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("investors").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("landing_pages").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("comps").select("*"),
    client.from("pipeline_cards").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("offers").select("*"),
    client.from("page_views").select("*"),
    client.from("campaigns").select("*").eq("workspace_id", WORKSPACE_ID),
    client.from("campaign_pages").select("*"),
    client.from("campaign_recipients").select("*"),
    client.from("activity_events").select("*").eq("workspace_id", WORKSPACE_ID),
  ]);

  const pages = (check(landingPages, "landing pages") as Record<string, unknown>[]).map(mapLanding);
  const pageIds = new Set(pages.map((page) => page.id));
  const campaignRows = (check(campaigns, "campaigns") as Record<string, unknown>[]).map(mapCampaign);
  const campaignIds = new Set(campaignRows.map((campaign) => campaign.id));

  return {
    workspace: mapWorkspace(check(workspace, "workspace") as Record<string, unknown>),
    prompts: (check(prompts, "prompts") as Record<string, unknown>[]).map(mapPrompt),
    deals: (check(deals, "deals") as Record<string, unknown>[]).map(mapDeal),
    investors: (check(investors, "investors") as Record<string, unknown>[]).map(mapInvestor),
    landingPages: pages,
    comps: (check(comps, "comps") as Record<string, unknown>[])
      .map(mapComp)
      .filter((comp) => pageIds.has(comp.landingPageId)),
    pipeline: (check(pipeline, "pipeline") as Record<string, unknown>[])
      .map(mapPipeline)
      .filter((card) => pageIds.has(card.landingPageId)),
    offers: (check(offers, "offers") as Record<string, unknown>[])
      .map(mapOffer)
      .filter((offer) => pageIds.has(offer.landingPageId)),
    views: (check(views, "views") as Record<string, unknown>[])
      .map(mapView)
      .filter((view) => pageIds.has(view.landingPageId)),
    campaigns: campaignRows,
    campaignPages: (check(campaignPages, "campaign pages") as Record<string, unknown>[])
      .map((row) => ({
        campaignId: String(row.campaign_id),
        landingPageId: String(row.landing_page_id),
      }))
      .filter((row) => campaignIds.has(row.campaignId)),
    recipients: (check(recipients, "recipients") as Record<string, unknown>[])
      .map(mapRecipient)
      .filter((recipient) => campaignIds.has(recipient.campaignId)),
    events: (check(events, "events") as Record<string, unknown>[]).map(mapEvent),
  };
}

async function replaceComps(landingPageId: string, comps: CompInput[]) {
  const client = sb();
  const removed = await client.from("comps").delete().eq("landing_page_id", landingPageId);
  if (removed.error) throw new Error(removed.error.message);
  if (!comps.length) return;
  const inserted = await client
    .from("comps")
    .insert(comps.map((comp, position) => compRow(comp, landingPageId, position)));
  if (inserted.error) throw new Error(inserted.error.message);
}

function landingValues(input: CreateLandingInput | UpdateLandingInput, extra: Record<string, unknown> = {}) {
  return {
    arv_min: input.arvMin,
    arv_max: input.arvMax,
    rehab_category: input.rehabCategory,
    rehab_reason: input.rehabReason,
    repair_estimate: input.repairEstimate,
    mao_min: input.maoMin,
    mao_max: input.maoMax,
    rent_min: input.rentMin,
    rent_max: input.rentMax,
    narrative: input.narrative,
    updated_at: new Date().toISOString(),
    ...extra,
  };
}

async function uniqueSlug(slug: string) {
  const client = sb();
  let next = slug || "property";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const existing = await client.from("landing_pages").select("id").eq("slug", next).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (!existing.data) return next;
    next = `${slug || "property"}-${attempt + 1}`;
  }
  return `${slug || "property"}-${crypto.randomUUID().slice(0, 6)}`;
}

export const supabaseStore: Store = {
  async getWorkspace() {
    const db = await loadDb();
    return db.workspace;
  },
  async getPrompts() {
    const db = await loadDb();
    return [...db.prompts].sort((a, b) => a.key.localeCompare(b.key));
  },
  async savePrompt(key, body) {
    await ensure();
    const result = await sb()
      .from("underwriting_prompts")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("workspace_id", WORKSPACE_ID)
      .eq("key", key);
    if (result.error) throw new Error(result.error.message);
  },
  async resetPrompts() {
    await ensure();
    const rows = defaultPrompts().map((prompt) => ({
      workspace_id: WORKSPACE_ID,
      key: prompt.key,
      title: PROMPT_TITLES[prompt.key as PromptKey],
      body: prompt.body,
      updated_at: prompt.updatedAt,
    }));
    const result = await sb().from("underwriting_prompts").upsert(rows, { onConflict: "workspace_id,key" });
    if (result.error) throw new Error(result.error.message);
  },
  async listDeals() {
    return listDeals(await loadDb());
  },
  async getDeal(id) {
    await ensure();
    const result = await sb().from("deals").select("*").eq("id", id).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data ? mapDeal(result.data as Record<string, unknown>) : null;
  },
  async createDeal(input: DealInput) {
    await ensure();
    const result = await sb().from("deals").insert(dealRow(input, crypto.randomUUID())).select("*").single();
    return mapDeal(check(result, "create deal") as Record<string, unknown>);
  },
  async updateDeal(id, patch) {
    await ensure();
    const result = await sb().from("deals").update(dealPatch(patch)).eq("id", id).select("*").single();
    return mapDeal(check(result, "update deal") as Record<string, unknown>);
  },
  async deleteDeal(id) {
    await ensure();
    const result = await sb().from("deals").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },
  async listInvestors() {
    return listInvestors(await loadDb());
  },
  async getInvestor(id) {
    await ensure();
    const result = await sb().from("investors").select("*").eq("id", id).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data ? mapInvestor(result.data as Record<string, unknown>) : null;
  },
  async createInvestor(input: InvestorInput) {
    const created = await this.createInvestors([input]);
    return created[0];
  },
  async createInvestors(inputs) {
    await ensure();
    if (!inputs.length) return [];
    const result = await sb()
      .from("investors")
      .insert(inputs.map((input) => investorRow(input, crypto.randomUUID())))
      .select("*");
    return (check(result, "create investors") as Record<string, unknown>[]).map(mapInvestor);
  },
  async updateInvestor(id, patch) {
    await ensure();
    const result = await sb().from("investors").update(investorPatch(patch)).eq("id", id).select("*").single();
    return mapInvestor(check(result, "update investor") as Record<string, unknown>);
  },
  async deleteInvestor(id) {
    await ensure();
    const result = await sb().from("investors").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },
  async listLandingPages() {
    return listLandingPages(await loadDb());
  },
  async getLandingPage(id) {
    return landingDetail(await loadDb(), id);
  },
  async getLandingPageBySlug(slug) {
    return landingBySlug(await loadDb(), slug);
  },
  async createLandingPage(input) {
    await ensure();
    const client = sb();
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const slug = await uniqueSlug(input.slug);
    const inserted = await client
      .from("landing_pages")
      .insert({
        id,
        workspace_id: WORKSPACE_ID,
        deal_id: input.dealId,
        slug,
        status: "active",
        published_at: timestamp,
        created_at: timestamp,
        ...landingValues(input),
      })
      .select("*")
      .single();
    if (inserted.error) throw new Error(inserted.error.message);
    await replaceComps(id, input.comps);
    const highest = await client
      .from("pipeline_cards")
      .select("position")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("stage", "underwriting")
      .order("position", { ascending: false })
      .limit(1);
    if (highest.error) throw new Error(highest.error.message);
    const position = ((highest.data?.[0]?.position as number | undefined) ?? -1) + 1;
    const card = await client.from("pipeline_cards").insert({
      id: crypto.randomUUID(),
      workspace_id: WORKSPACE_ID,
      landing_page_id: id,
      stage: "underwriting",
      position,
      updated_at: timestamp,
    });
    if (card.error) throw new Error(card.error.message);
    const detail = await this.getLandingPage(id);
    if (!detail) throw new Error("Could not create the landing page");
    return detail;
  },
  async updateLandingPage(id, input) {
    await ensure();
    const result = await sb().from("landing_pages").update(landingValues(input)).eq("id", id).select("*").single();
    if (result.error) throw new Error(result.error.message);
    await replaceComps(id, input.comps);
    const detail = await this.getLandingPage(id);
    if (!detail) throw new Error("Landing page not found");
    return detail;
  },
  async deleteLandingPage(id) {
    await ensure();
    const result = await sb().from("landing_pages").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },
  async createOffer(input: OfferInput) {
    await ensure();
    const result = await sb()
      .from("offers")
      .insert({
        id: crypto.randomUUID(),
        landing_page_id: input.landingPageId,
        investor_id: input.investorId,
        investor_name: input.investorName,
        amount: input.amount,
        terms: input.terms,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
      })
      .select("*")
      .single();
    return mapOffer(check(result, "create offer") as Record<string, unknown>);
  },
  async recordView(input: ViewInput) {
    await ensure();
    const result = await sb().from("page_views").insert({
      id: crypto.randomUUID(),
      landing_page_id: input.landingPageId,
      investor_id: input.investorId,
      visitor_key: input.visitorKey,
    });
    if (result.error) throw new Error(result.error.message);
  },
  async getActivity(landingPageId) {
    const db = await loadDb();
    if (!db.landingPages.some((page) => page.id === landingPageId)) {
      return { offers: [], views: [], interested: [], stats: { offers: 0, views: 0, uniqueVisitors: 0 } };
    }
    return activityFor(db, landingPageId);
  },
  async listCampaigns() {
    return listCampaigns(await loadDb());
  },
  async getCampaign(id) {
    return campaignDetail(await loadDb(), id);
  },
  async createCampaign(input: CreateCampaignInput) {
    await ensure();
    const client = sb();
    const id = crypto.randomUUID();
    const created = await client
      .from("campaigns")
      .insert({
        id,
        workspace_id: WORKSPACE_ID,
        name: input.subject || "Newsletter",
        subject: input.subject,
        body: input.body,
        status: input.status,
        scheduled_at: input.scheduledAt,
      })
      .select("*")
      .single();
    if (created.error) throw new Error(created.error.message);
    if (input.landingPageIds.length) {
      const pages = await client.from("campaign_pages").insert(
        input.landingPageIds.map((landingPageId) => ({
          campaign_id: id,
          landing_page_id: landingPageId,
        })),
      );
      if (pages.error) throw new Error(pages.error.message);
    }
    if (input.recipients.length) {
      const recipients = await client.from("campaign_recipients").insert(
        input.recipients.map((recipient) => ({
          id: crypto.randomUUID(),
          campaign_id: id,
          investor_id: recipient.investorId,
          token: crypto.randomUUID(),
          matched_landing_page_ids: recipient.matchedLandingPageIds,
        })),
      );
      if (recipients.error) throw new Error(recipients.error.message);
    }
    const detail = await this.getCampaign(id);
    if (!detail) throw new Error("Could not create the newsletter");
    return detail;
  },
  async getRecipientByToken(token) {
    await ensure();
    const result = await sb().from("campaign_recipients").select("*").eq("token", token).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data ? mapRecipient(result.data as Record<string, unknown>) : null;
  },
  async markRecipientSent(id) {
    await ensure();
    const result = await sb()
      .from("campaign_recipients")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },
  async markCampaignSent(id, note) {
    await ensure();
    const result = await sb()
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivery_note: note,
      })
      .eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },
  async listDueCampaigns() {
    const db = await loadDb();
    const timestamp = new Date().toISOString();
    return db.campaigns
      .filter(
        (campaign) =>
          campaign.status === "scheduled" && campaign.scheduledAt && campaign.scheduledAt <= timestamp,
      )
      .map((campaign) => campaignDetail(db, campaign.id))
      .filter((campaign): campaign is NonNullable<typeof campaign> => Boolean(campaign));
  },
  async listPipeline() {
    return listPipeline(await loadDb());
  },
  async movePipelineCard(cardId, stage, index) {
    const db = await loadDb();
    const next = movePipelineRows(db.pipeline, cardId, stage, index);
    const client = sb();
    const timestamp = new Date().toISOString();
    for (const row of next) {
      const previous = db.pipeline.find((item) => item.id === row.id);
      if (previous && previous.stage === row.stage && previous.position === row.position) continue;
      const result = await client
        .from("pipeline_cards")
        .update({ stage: row.stage, position: row.position, updated_at: timestamp })
        .eq("id", row.id);
      if (result.error) throw new Error(result.error.message);
    }
  },
  async addEvent(input: EventInput) {
    await ensure();
    const result = await sb().from("activity_events").insert({
      id: crypto.randomUUID(),
      workspace_id: WORKSPACE_ID,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      ref_type: input.refType ?? "",
      ref_id: input.refId || null,
    });
    if (result.error) throw new Error(result.error.message);
  },
  async listEvents() {
    const db = await loadDb();
    return [...db.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

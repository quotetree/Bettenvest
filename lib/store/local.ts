import "server-only";

import fs from "fs/promises";
import path from "path";
import { defaultPrompts } from "@/lib/prompts";
import type { Store } from "@/lib/store/api";
import { seedDb, type DB } from "@/lib/store/model";
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
  removeLandingPage,
} from "@/lib/store/select";
import type { Comp, Deal, Investor, LandingPage, Offer, Recipient } from "@/lib/types";

const file = path.join(process.cwd(), ".data", "store.json");
let chain: Promise<void> = Promise.resolve();

async function read(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as DB;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    const seeded = seedDb();
    await write(seeded);
    return seeded;
  }
}

async function write(db: DB) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(db, null, 2));
}

function withDb<T>(fn: (db: DB) => T | Promise<T>, persist = true): Promise<T> {
  const run = chain.then(async () => {
    const db = await read();
    const result = await fn(db);
    if (persist) await write(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function now() {
  return new Date().toISOString();
}

function requireDeal(db: DB, id: string): Deal {
  const deal = db.deals.find((item) => item.id === id);
  if (!deal) throw new Error("Deal not found");
  return deal;
}

function uniqueSlug(db: DB, slug: string) {
  let next = slug || "property";
  while (db.landingPages.some((page) => page.slug === next)) {
    next = `${slug || "property"}-${Math.random().toString(36).slice(2, 5)}`;
  }
  return next;
}

function makeDeal(input: Store extends { createDeal(input: infer T): unknown } ? T : never): Deal {
  const timestamp = now();
  return { ...input, id: crypto.randomUUID(), uploadedAt: timestamp, updatedAt: timestamp };
}

function makeInvestor(input: Parameters<Store["createInvestor"]>[0]): Investor {
  const timestamp = now();
  return { ...input, id: crypto.randomUUID(), addedAt: timestamp, updatedAt: timestamp };
}

function insertComps(db: DB, landingPageId: string, comps: Parameters<Store["createLandingPage"]>[0]["comps"]) {
  comps.forEach((comp, position) => {
    const row: Comp = {
      ...comp,
      id: crypto.randomUUID(),
      landingPageId,
      position,
      soldDate: comp.soldDate || "",
    };
    db.comps.push(row);
  });
}

function emptyActivity() {
  return { offers: [], views: [], interested: [], stats: { offers: 0, views: 0, uniqueVisitors: 0 } };
}

export const localStore: Store = {
  async getWorkspace() {
    return withDb((db) => db.workspace, false);
  },
  async getPrompts() {
    return withDb((db) => {
      if (!db.prompts?.length) db.prompts = defaultPrompts();
      return [...db.prompts].sort((a, b) => a.key.localeCompare(b.key));
    });
  },
  async savePrompt(key, body) {
    await withDb((db) => {
      const prompt = db.prompts.find((item) => item.key === key);
      if (!prompt) throw new Error("Prompt not found");
      prompt.body = body;
      prompt.updatedAt = now();
    });
  },
  async resetPrompts() {
    await withDb((db) => {
      db.prompts = defaultPrompts();
    });
  },
  async listDeals() {
    return withDb((db) => listDeals(db), false);
  },
  async getDeal(id) {
    return withDb((db) => db.deals.find((deal) => deal.id === id) ?? null, false);
  },
  async createDeal(input) {
    return withDb((db) => {
      const deal = makeDeal(input);
      db.deals.push(deal);
      return deal;
    });
  },
  async updateDeal(id, patch) {
    return withDb((db) => {
      const deal = requireDeal(db, id);
      Object.assign(deal, patch, { updatedAt: now() });
      return deal;
    });
  },
  async deleteDeal(id) {
    await withDb((db) => {
      const pageIds = db.landingPages.filter((page) => page.dealId === id).map((page) => page.id);
      pageIds.forEach((pageId) => removeLandingPage(db, pageId));
      db.deals = db.deals.filter((deal) => deal.id !== id);
    });
  },
  async listInvestors() {
    return withDb((db) => listInvestors(db), false);
  },
  async getInvestor(id) {
    return withDb((db) => db.investors.find((investor) => investor.id === id) ?? null, false);
  },
  async createInvestor(input) {
    return withDb((db) => {
      const investor = makeInvestor(input);
      db.investors.push(investor);
      return investor;
    });
  },
  async createInvestors(inputs) {
    return withDb((db) => {
      const created = inputs.map((input) => makeInvestor(input));
      db.investors.push(...created);
      return created;
    });
  },
  async updateInvestor(id, patch) {
    return withDb((db) => {
      const investor = db.investors.find((item) => item.id === id);
      if (!investor) throw new Error("Investor not found");
      Object.assign(investor, patch, { updatedAt: now() });
      return investor;
    });
  },
  async deleteInvestor(id) {
    await withDb((db) => {
      db.investors = db.investors.filter((investor) => investor.id !== id);
      db.offers = db.offers.map((offer) =>
        offer.investorId === id ? { ...offer, investorId: null } : offer,
      );
      db.views = db.views.map((view) =>
        view.investorId === id ? { ...view, investorId: null } : view,
      );
      db.recipients = db.recipients.filter((recipient) => recipient.investorId !== id);
    });
  },
  async listLandingPages() {
    return withDb((db) => listLandingPages(db), false);
  },
  async getLandingPage(id) {
    return withDb((db) => landingDetail(db, id), false);
  },
  async getLandingPageBySlug(slug) {
    return withDb((db) => landingBySlug(db, slug), false);
  },
  async createLandingPage(input) {
    return withDb((db) => {
      if (!db.deals.some((deal) => deal.id === input.dealId)) throw new Error("Deal not found");
      const timestamp = now();
      const page: LandingPage = {
        id: crypto.randomUUID(),
        dealId: input.dealId,
        slug: uniqueSlug(db, input.slug),
        status: "active",
        arvMin: input.arvMin,
        arvMax: input.arvMax,
        rehabCategory: input.rehabCategory,
        rehabReason: input.rehabReason,
        repairEstimate: input.repairEstimate,
        maoMin: input.maoMin,
        maoMax: input.maoMax,
        rentMin: input.rentMin,
        rentMax: input.rentMax,
        narrative: input.narrative,
        publishedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.landingPages.push(page);
      insertComps(db, page.id, input.comps);
      const position =
        db.pipeline
          .filter((card) => card.stage === "underwriting")
          .reduce((max, card) => Math.max(max, card.position), -1) + 1;
      db.pipeline.push({
        id: crypto.randomUUID(),
        landingPageId: page.id,
        stage: "underwriting",
        position,
      });
      const detail = landingDetail(db, page.id);
      if (!detail) throw new Error("Could not create the landing page");
      return detail;
    });
  },
  async updateLandingPage(id, input) {
    return withDb((db) => {
      const page = db.landingPages.find((item) => item.id === id);
      if (!page) throw new Error("Landing page not found");
      Object.assign(page, {
        arvMin: input.arvMin,
        arvMax: input.arvMax,
        rehabCategory: input.rehabCategory,
        rehabReason: input.rehabReason,
        repairEstimate: input.repairEstimate,
        maoMin: input.maoMin,
        maoMax: input.maoMax,
        rentMin: input.rentMin,
        rentMax: input.rentMax,
        narrative: input.narrative,
        updatedAt: now(),
      });
      db.comps = db.comps.filter((comp) => comp.landingPageId !== id);
      insertComps(db, id, input.comps);
      const detail = landingDetail(db, id);
      if (!detail) throw new Error("Landing page not found");
      return detail;
    });
  },
  async deleteLandingPage(id) {
    await withDb((db) => removeLandingPage(db, id));
  },
  async createOffer(input) {
    return withDb((db) => {
      const offer: Offer = { ...input, id: crypto.randomUUID(), createdAt: now() };
      db.offers.push(offer);
      return offer;
    });
  },
  async recordView(input) {
    await withDb((db) => {
      db.views.push({ ...input, id: crypto.randomUUID(), createdAt: now() });
    });
  },
  async getActivity(landingPageId) {
    return withDb((db) => {
      if (!db.landingPages.some((page) => page.id === landingPageId)) return emptyActivity();
      return activityFor(db, landingPageId);
    }, false);
  },
  async listCampaigns() {
    return withDb((db) => listCampaigns(db), false);
  },
  async getCampaign(id) {
    return withDb((db) => campaignDetail(db, id), false);
  },
  async createCampaign(input) {
    return withDb((db) => {
      const timestamp = now();
      const campaign = {
        id: crypto.randomUUID(),
        name: input.subject || "Newsletter",
        subject: input.subject,
        body: input.body,
        status: input.status,
        scheduledAt: input.scheduledAt,
        sentAt: null,
        deliveryNote: null,
        createdAt: timestamp,
      };
      db.campaigns.push(campaign);
      input.landingPageIds.forEach((landingPageId) => {
        db.campaignPages.push({ campaignId: campaign.id, landingPageId });
      });
      input.recipients.forEach((recipient) => {
        const row: Recipient = {
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          investorId: recipient.investorId,
          token: crypto.randomUUID(),
          matchedLandingPageIds: recipient.matchedLandingPageIds,
          sentAt: null,
        };
        db.recipients.push(row);
      });
      const detail = campaignDetail(db, campaign.id);
      if (!detail) throw new Error("Could not create the newsletter");
      return detail;
    });
  },
  async getRecipientByToken(token) {
    return withDb(
      (db) => db.recipients.find((recipient) => recipient.token === token) ?? null,
      false,
    );
  },
  async markRecipientSent(id) {
    await withDb((db) => {
      const recipient = db.recipients.find((item) => item.id === id);
      if (recipient) recipient.sentAt = now();
    });
  },
  async markCampaignSent(id, note) {
    await withDb((db) => {
      const campaign = db.campaigns.find((item) => item.id === id);
      if (!campaign) return;
      campaign.status = "sent";
      campaign.sentAt = now();
      campaign.deliveryNote = note;
    });
  },
  async listDueCampaigns() {
    return withDb((db) => {
      const timestamp = now();
      return db.campaigns
        .filter(
          (campaign) =>
            campaign.status === "scheduled" &&
            campaign.scheduledAt &&
            campaign.scheduledAt <= timestamp,
        )
        .map((campaign) => campaignDetail(db, campaign.id))
        .filter((campaign): campaign is NonNullable<typeof campaign> => Boolean(campaign));
    }, false);
  },
  async listPipeline() {
    return withDb((db) => listPipeline(db), false);
  },
  async movePipelineCard(cardId, stage, index) {
    await withDb((db) => {
      db.pipeline = movePipelineRows(db.pipeline, cardId, stage, index);
    });
  },
  async addEvent(input) {
    await withDb((db) => {
      db.events.push({
        id: crypto.randomUUID(),
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        refType: input.refType ?? "",
        refId: input.refId ?? "",
        createdAt: now(),
      });
    });
  },
  async listEvents() {
    return withDb(
      (db) => [...db.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      false,
    );
  },
};

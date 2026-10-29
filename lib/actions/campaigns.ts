"use server";

import { deliverCampaign } from "@/lib/email/deliver";
import { messageOf } from "@/lib/format";
import { matchInvestors } from "@/lib/matching";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import type { MatchPage } from "@/lib/types";

export async function sendCampaignAction(input: {
  subject: string;
  body: string;
  landingPageIds: string[];
  scheduledAt: string | null;
}) {
  try {
    if (!input.subject.trim()) return { ok: false as const, error: "Enter an email subject" };
    if (!input.landingPageIds.length) return { ok: false as const, error: "Select at least one landing page" };
    const [pages, investors] = await Promise.all([store.listLandingPages(), store.listInvestors()]);
    const selected: MatchPage[] = pages
      .filter((page) => input.landingPageIds.includes(page.id))
      .map((page) => ({
        id: page.id,
        slug: page.slug,
        street: page.deal.street,
        city: page.deal.city,
        county: page.deal.county,
        state: page.deal.state,
        zip: page.deal.zip,
        listPrice: page.deal.listPrice,
        arvMin: page.arvMin,
        arvMax: page.arvMax,
      }));
    const matched = matchInvestors(investors, selected);
    if (!matched.recipients.length) {
      return {
        ok: false as const,
        error: "No investors with an email match these landing pages. Check cities, counties, and price ranges.",
      };
    }
    const scheduled =
      input.scheduledAt && new Date(input.scheduledAt).getTime() > Date.now() ? input.scheduledAt : null;
    const campaign = await store.createCampaign({
      subject: input.subject.trim(),
      body: input.body,
      status: scheduled ? "scheduled" : "draft",
      scheduledAt: scheduled,
      landingPageIds: selected.map((page) => page.id),
      recipients: matched.recipients.map((recipient) => ({
        investorId: recipient.investor.id,
        matchedLandingPageIds: recipient.pages.map((page) => page.id),
      })),
    });
    if (scheduled) {
      refreshApp();
      return { ok: true as const, id: campaign.id, note: "Scheduled" };
    }
    const delivered = await deliverCampaign(campaign.id);
    refreshApp();
    if (!delivered.ok) return { ok: false as const, error: delivered.error, id: campaign.id };
    return { ok: true as const, id: campaign.id, note: delivered.note };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function deliverCampaignAction(id: string) {
  try {
    const delivered = await deliverCampaign(id);
    refreshApp();
    if (!delivered.ok) return delivered;
    return { ok: true as const, note: delivered.note };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

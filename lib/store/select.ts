import type {
  ActivitySnapshot,
  CampaignDetail,
  CampaignSummary,
  InterestedVisitor,
  LandingPageDetail,
  LandingPageListItem,
  PipelineCardModel,
} from "@/lib/types";
import type { DB } from "@/lib/store/model";

export function listDeals(db: DB) {
  return [...db.deals].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function listInvestors(db: DB) {
  return [...db.investors].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function toLandingListItem(db: DB, pageId: string): LandingPageListItem | null {
  const page = db.landingPages.find((item) => item.id === pageId);
  if (!page) return null;
  const deal = db.deals.find((item) => item.id === page.dealId);
  if (!deal) return null;
  return {
    ...page,
    deal,
    offerCount: db.offers.filter((offer) => offer.landingPageId === page.id).length,
    viewCount: db.views.filter((view) => view.landingPageId === page.id).length,
  };
}

export function listLandingPages(db: DB): LandingPageListItem[] {
  return db.landingPages
    .map((page) => toLandingListItem(db, page.id))
    .filter((page): page is LandingPageListItem => Boolean(page))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function landingDetail(db: DB, pageId: string): LandingPageDetail | null {
  const page = db.landingPages.find((item) => item.id === pageId);
  if (!page) return null;
  const deal = db.deals.find((item) => item.id === page.dealId);
  if (!deal) return null;
  const comps = db.comps
    .filter((comp) => comp.landingPageId === page.id)
    .sort((a, b) => a.position - b.position);
  return { ...page, deal, comps };
}

export function landingBySlug(db: DB, slug: string): LandingPageDetail | null {
  const page = db.landingPages.find((item) => item.slug === slug);
  return page ? landingDetail(db, page.id) : null;
}

export function activityFor(db: DB, landingPageId: string): ActivitySnapshot {
  const offers = db.offers
    .filter((offer) => offer.landingPageId === landingPageId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const views = db.views
    .filter((view) => view.landingPageId === landingPageId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const investors = new Map(db.investors.map((investor) => [investor.id, investor]));
  const groups = new Map<
    string,
    InterestedVisitor & { hasOffer: boolean }
  >();

  const touch = (
    key: string,
    name: string,
    phone: string,
    email: string,
    when: string,
    hasOffer: boolean,
  ) => {
    const current = groups.get(key);
    if (!current) {
      groups.set(key, {
        key,
        name: name || "Investor",
        phone,
        email,
        interest: hasOffer ? "High" : "Viewed",
        lastViewed: when,
        hasOffer,
      });
      return;
    }
    if (when > current.lastViewed) current.lastViewed = when;
    if (name) current.name = name;
    if (phone) current.phone = phone;
    if (email) current.email = email;
    if (hasOffer) {
      current.hasOffer = true;
      current.interest = "High";
    }
  };

  for (const view of views) {
    if (!view.investorId) continue;
    const investor = investors.get(view.investorId);
    touch(
      `investor:${view.investorId}`,
      investor?.fullName || "",
      investor?.phone || "",
      investor?.email || "",
      view.createdAt,
      false,
    );
  }

  for (const offer of offers) {
    const key = offer.investorId
      ? `investor:${offer.investorId}`
      : offer.email
        ? `email:${offer.email.toLowerCase()}`
        : `offer:${offer.id}`;
    const investor = offer.investorId ? investors.get(offer.investorId) : undefined;
    touch(
      key,
      offer.investorName || investor?.fullName || "",
      offer.phone || investor?.phone || "",
      offer.email || investor?.email || "",
      offer.createdAt,
      true,
    );
  }

  const unique = new Set(
    views.map((view) => view.investorId || view.visitorKey || view.id),
  );

  return {
    offers,
    views,
    interested: [...groups.values()]
      .map(({ hasOffer: _hasOffer, ...visitor }) => visitor)
      .sort((a, b) => b.lastViewed.localeCompare(a.lastViewed)),
    stats: {
      offers: offers.length,
      views: views.length,
      uniqueVisitors: unique.size,
    },
  };
}

function sentRecipients(db: DB, landingPageId: string) {
  return db.recipients.filter(
    (recipient) =>
      recipient.sentAt && recipient.matchedLandingPageIds.includes(landingPageId),
  );
}

export function listPipeline(db: DB): PipelineCardModel[] {
  const initials = db.workspace.ownerInitials || "SB";
  return db.pipeline
    .flatMap((card) => {
      const page = db.landingPages.find((item) => item.id === card.landingPageId);
      const deal = page ? db.deals.find((item) => item.id === page.dealId) : undefined;
      if (!page || !deal) return [];
      const emailed = sentRecipients(db, page.id);
      const interested = new Set(
        db.views
          .filter((view) => view.landingPageId === page.id && view.investorId)
          .map((view) => view.investorId),
      );
      return [
        {
          id: card.id,
          landingPageId: page.id,
          stage: card.stage,
          position: card.position,
          street: deal.street || "Untitled property",
          city: deal.city,
          state: deal.state,
          zip: deal.zip,
          buyers: new Set(emailed.map((recipient) => recipient.investorId)).size,
          contacted: emailed.length,
          interested: interested.size,
          initials,
        },
      ];
    })
    .sort((a, b) => a.position - b.position);
}

export function listCampaigns(db: DB): CampaignSummary[] {
  return [...db.campaigns]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((campaign) => ({
      ...campaign,
      pageCount: db.campaignPages.filter((row) => row.campaignId === campaign.id).length,
      recipientCount: db.recipients.filter((row) => row.campaignId === campaign.id).length,
    }));
}

export function campaignDetail(db: DB, id: string): CampaignDetail | null {
  const campaign = db.campaigns.find((item) => item.id === id);
  if (!campaign) return null;
  const pages = db.campaignPages
    .filter((row) => row.campaignId === id)
    .map((row) => toLandingListItem(db, row.landingPageId))
    .filter((page): page is LandingPageListItem => Boolean(page));
  const recipients = db.recipients.flatMap((recipient) => {
    if (recipient.campaignId !== id) return [];
    const investor = db.investors.find((item) => item.id === recipient.investorId);
    if (!investor) return [];
    return [{ ...recipient, investor }];
  });
  return { ...campaign, pages, recipients };
}

export function movePipelineRows(
  rows: DB["pipeline"],
  cardId: string,
  stage: DB["pipeline"][number]["stage"],
  index: number,
): DB["pipeline"] {
  const next = rows.map((row) => ({ ...row }));
  const card = next.find((row) => row.id === cardId);
  if (!card) return rows;
  const previous = card.stage;
  card.stage = stage;
  const destination = next
    .filter((row) => row.stage === stage && row.id !== cardId)
    .sort((a, b) => a.position - b.position);
  const at = Math.max(0, Math.min(index, destination.length));
  destination.splice(at, 0, card);
  destination.forEach((row, position) => {
    row.position = position;
  });
  if (previous !== stage) {
    next
      .filter((row) => row.stage === previous)
      .sort((a, b) => a.position - b.position)
      .forEach((row, position) => {
        row.position = position;
      });
  }
  return next;
}

export function removeLandingPage(db: DB, pageId: string) {
  db.landingPages = db.landingPages.filter((page) => page.id !== pageId);
  db.comps = db.comps.filter((comp) => comp.landingPageId !== pageId);
  db.pipeline = db.pipeline.filter((card) => card.landingPageId !== pageId);
  db.offers = db.offers.filter((offer) => offer.landingPageId !== pageId);
  db.views = db.views.filter((view) => view.landingPageId !== pageId);
  db.campaignPages = db.campaignPages.filter((row) => row.landingPageId !== pageId);
  db.recipients = db.recipients.map((recipient) => ({
    ...recipient,
    matchedLandingPageIds: recipient.matchedLandingPageIds.filter((id) => id !== pageId),
  }));
}

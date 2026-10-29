export type DealStatus =
  | "go"
  | "no_go"
  | "follow_up"
  | "no_answer"
  | "deal_desk";

export type Priority = "hot" | "warm" | "cold";

export type RehabCategory = "light" | "average" | "heavy";

export type PipelineStage =
  | "underwriting"
  | "marketing"
  | "assigned"
  | "inspections"
  | "closed";

export type PromptKey = "arv" | "repairs_mao";

export type LandingStatus = "active" | "draft";

export type CampaignStatus = "draft" | "scheduled" | "sent";

export type EventType =
  | "offer"
  | "email_sent"
  | "link_viewed"
  | "pipeline_task"
  | "upload_complete";

export type Workspace = {
  id: string;
  name: string;
  ownerInitials: string;
};

export type UnderwritingPrompt = {
  key: PromptKey;
  title: string;
  body: string;
  updatedAt: string;
};

export type Deal = {
  id: string;
  status: DealStatus;
  uploadedAt: string;
  listingId: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  listPrice: number | null;
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  lotSqft: number | null;
  stories: number | null;
  yearBuilt: number | null;
  garage: string;
  daysOnMarket: number | null;
  cdom: number | null;
  condition: string;
  propertyType: string;
  agentName: string;
  agentPhone: string;
  agentOffice: string;
  agentEmail: string;
  agentNotes: string;
  sourcePdfPath: string | null;
  photos: string[];
  extracted: unknown | null;
  updatedAt: string;
};

export type DealInput = Omit<Deal, "id" | "uploadedAt" | "updatedAt">;

export type Investor = {
  id: string;
  priority: Priority;
  addedAt: string;
  fullName: string;
  phone: string;
  email: string;
  investorType: string;
  preferredCounties: string[];
  preferredCities: string[];
  priceMin: number | null;
  priceMax: number | null;
  funding: string;
  crmLink: string;
  notes: string;
  updatedAt: string;
};

export type InvestorInput = Omit<Investor, "id" | "addedAt" | "updatedAt">;

export type Comp = {
  id: string;
  landingPageId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  salePrice: number | null;
  sqft: number | null;
  beds: number | null;
  baths: number | null;
  soldDate: string;
  dom: number | null;
  condition: string;
  stories: number | null;
  sourcePdfPath: string | null;
  position: number;
};

export type CompInput = Omit<Comp, "id" | "landingPageId" | "position">;

export type LandingPage = {
  id: string;
  dealId: string;
  slug: string;
  status: LandingStatus;
  arvMin: number | null;
  arvMax: number | null;
  rehabCategory: RehabCategory | null;
  rehabReason: string;
  repairEstimate: number | null;
  maoMin: number | null;
  maoMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  narrative: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingPageListItem = LandingPage & {
  deal: Deal;
  offerCount: number;
  viewCount: number;
};

export type LandingPageDetail = LandingPage & {
  deal: Deal;
  comps: Comp[];
};

export type Offer = {
  id: string;
  landingPageId: string;
  investorId: string | null;
  investorName: string;
  amount: number | null;
  terms: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

export type PageView = {
  id: string;
  landingPageId: string;
  investorId: string | null;
  visitorKey: string;
  createdAt: string;
};

export type InterestedVisitor = {
  key: string;
  name: string;
  phone: string;
  email: string;
  interest: "High" | "Viewed";
  lastViewed: string;
};

export type ActivitySnapshot = {
  offers: Offer[];
  views: PageView[];
  interested: InterestedVisitor[];
  stats: {
    offers: number;
    views: number;
    uniqueVisitors: number;
  };
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveryNote: string | null;
  createdAt: string;
};

export type Recipient = {
  id: string;
  campaignId: string;
  investorId: string;
  token: string;
  matchedLandingPageIds: string[];
  sentAt: string | null;
};

export type CampaignSummary = Campaign & {
  pageCount: number;
  recipientCount: number;
};

export type CampaignDetail = Campaign & {
  pages: LandingPageListItem[];
  recipients: Array<
    Recipient & {
      investor: Investor;
    }
  >;
};

export type PipelineCardModel = {
  id: string;
  landingPageId: string;
  stage: PipelineStage;
  position: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  buyers: number;
  contacted: number;
  interested: number;
  initials: string;
};

export type ActivityEvent = {
  id: string;
  type: EventType;
  title: string;
  body: string;
  refType: string;
  refId: string;
  createdAt: string;
};

export type MatchPage = {
  id: string;
  slug: string;
  street: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  listPrice: number | null;
  arvMin: number | null;
  arvMax: number | null;
};

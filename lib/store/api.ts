import type {
  ActivityEvent,
  ActivitySnapshot,
  CampaignDetail,
  CampaignStatus,
  CampaignSummary,
  CompInput,
  Deal,
  DealInput,
  EventType,
  Investor,
  InvestorInput,
  LandingPageDetail,
  LandingPageListItem,
  Offer,
  PipelineCardModel,
  PipelineStage,
  PromptKey,
  Recipient,
  RehabCategory,
  UnderwritingPrompt,
  Workspace,
} from "@/lib/types";

export type CreateLandingInput = {
  dealId: string;
  slug: string;
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
  comps: CompInput[];
};

export type UpdateLandingInput = Omit<CreateLandingInput, "dealId" | "slug">;

export type CreateCampaignInput = {
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  landingPageIds: string[];
  recipients: { investorId: string; matchedLandingPageIds: string[] }[];
};

export type OfferInput = {
  landingPageId: string;
  investorId: string | null;
  investorName: string;
  amount: number | null;
  terms: string;
  phone: string;
  email: string;
  notes: string;
};

export type ViewInput = {
  landingPageId: string;
  investorId: string | null;
  visitorKey: string;
};

export type EventInput = {
  type: EventType;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
};

export interface Store {
  getWorkspace(): Promise<Workspace>;
  getPrompts(): Promise<UnderwritingPrompt[]>;
  savePrompt(key: PromptKey, body: string): Promise<void>;
  resetPrompts(): Promise<void>;
  listDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | null>;
  createDeal(input: DealInput): Promise<Deal>;
  updateDeal(id: string, patch: Partial<DealInput>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  listInvestors(): Promise<Investor[]>;
  getInvestor(id: string): Promise<Investor | null>;
  createInvestor(input: InvestorInput): Promise<Investor>;
  createInvestors(inputs: InvestorInput[]): Promise<Investor[]>;
  updateInvestor(id: string, patch: Partial<InvestorInput>): Promise<Investor>;
  deleteInvestor(id: string): Promise<void>;
  listLandingPages(): Promise<LandingPageListItem[]>;
  getLandingPage(id: string): Promise<LandingPageDetail | null>;
  getLandingPageBySlug(slug: string): Promise<LandingPageDetail | null>;
  createLandingPage(input: CreateLandingInput): Promise<LandingPageDetail>;
  updateLandingPage(id: string, input: UpdateLandingInput): Promise<LandingPageDetail>;
  deleteLandingPage(id: string): Promise<void>;
  createOffer(input: OfferInput): Promise<Offer>;
  recordView(input: ViewInput): Promise<void>;
  getActivity(landingPageId: string): Promise<ActivitySnapshot>;
  listCampaigns(): Promise<CampaignSummary[]>;
  getCampaign(id: string): Promise<CampaignDetail | null>;
  createCampaign(input: CreateCampaignInput): Promise<CampaignDetail>;
  getRecipientByToken(token: string): Promise<Recipient | null>;
  markRecipientSent(id: string): Promise<void>;
  markCampaignSent(id: string, note: string | null): Promise<void>;
  listDueCampaigns(): Promise<CampaignDetail[]>;
  listPipeline(): Promise<PipelineCardModel[]>;
  movePipelineCard(cardId: string, stage: PipelineStage, index: number): Promise<void>;
  addEvent(input: EventInput): Promise<void>;
  listEvents(): Promise<ActivityEvent[]>;
}

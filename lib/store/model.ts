import { defaultPrompts } from "@/lib/prompts";
import { WORKSPACE_ID } from "@/lib/workspace";
import type {
  ActivityEvent,
  Campaign,
  Comp,
  Deal,
  Investor,
  LandingPage,
  Offer,
  PageView,
  PipelineStage,
  Recipient,
  Workspace,
  UnderwritingPrompt,
} from "@/lib/types";

export type PipelineRow = {
  id: string;
  landingPageId: string;
  stage: PipelineStage;
  position: number;
};

export type CampaignPageRow = {
  campaignId: string;
  landingPageId: string;
};

export type DB = {
  workspace: Workspace;
  prompts: UnderwritingPrompt[];
  deals: Deal[];
  investors: Investor[];
  landingPages: LandingPage[];
  comps: Comp[];
  pipeline: PipelineRow[];
  offers: Offer[];
  views: PageView[];
  campaigns: Campaign[];
  campaignPages: CampaignPageRow[];
  recipients: Recipient[];
  events: ActivityEvent[];
};

export function seedDb(): DB {
  const now = new Date().toISOString();
  return {
    workspace: { id: WORKSPACE_ID, name: "Bettenvest", ownerInitials: "SB" },
    prompts: defaultPrompts(now),
    deals: [],
    investors: [],
    landingPages: [],
    comps: [],
    pipeline: [],
    offers: [],
    views: [],
    campaigns: [],
    campaignPages: [],
    recipients: [],
    events: [],
  };
}

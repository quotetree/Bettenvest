import type { DealStatus, PipelineStage, Priority } from "@/lib/types";

export const DEAL_STATUSES: { value: DealStatus; label: string }[] = [
  { value: "go", label: "Go" },
  { value: "no_go", label: "No go" },
  { value: "follow_up", label: "Follow up" },
  { value: "no_answer", label: "No answer" },
  { value: "deal_desk", label: "Deal desk" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export const PIPELINE_STAGES: {
  value: PipelineStage;
  label: string;
  header: string;
  count: string;
}[] = [
  {
    value: "underwriting",
    label: "Underwriting",
    header: "bg-blue-500",
    count: "text-blue-100",
  },
  {
    value: "marketing",
    label: "Marketing",
    header: "bg-amber-400",
    count: "text-amber-950/70",
  },
  {
    value: "assigned",
    label: "Assigned",
    header: "bg-red-500",
    count: "text-red-100",
  },
  {
    value: "inspections",
    label: "Inspections",
    header: "bg-orange-500",
    count: "text-orange-100",
  },
  {
    value: "closed",
    label: "Closed",
    header: "bg-green-500",
    count: "text-green-100",
  },
];

export const CONDITIONS = [
  "Needs updating",
  "Cosmetic",
  "Average",
  "Good",
  "Excellent",
  "Tear down",
];

export const PROPERTY_TYPES = [
  "Single-family",
  "Condo",
  "Townhouse",
  "Multi-family",
  "Land",
];

export const NEXT_STEPS: { title: string; body: string }[] = [
  {
    title: "Review the Opportunity",
    body: "Evaluate the property details, comparable sales, and potential investment upside.",
  },
  {
    title: "Make an Offer",
    body: "Enter your proposed purchase price and terms directly through this page.",
  },
  {
    title: "Review & Confirm",
    body: "We'll contact you to review your offer, discuss the details, and confirm your buying criteria.",
  },
  {
    title: "Formalize Your Offer",
    body: "We'll prepare the purchase agreement and buyer representation paperwork for your review and signature.",
  },
  {
    title: "Present & Negotiate",
    body: "We'll submit your signed offer to the listing agent and negotiate on your behalf.",
  },
  {
    title: "Open Escrow",
    body: "Once your offer is accepted, we'll coordinate the escrow process, due diligence, and closing.",
  },
];

export const DISCLAIMER =
  "This landing page represents an on-market investment opportunity presented for informational and evaluation purposes only and does not constitute a formal offer, guarantee of property availability, or promise of investment returns.";

export const TIME_SENSITIVE =
  "Time-sensitive opportunity – This listing is being shown to multiple investors.";

export const NAV_ITEMS = [
  { href: "/newsletter", label: "Newsletter" },
  { href: "/deal-tracker", label: "Deal Tracker" },
  { href: "/investors", label: "Investor Leads" },
  { href: "/landing-pages", label: "Landing Pages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/pipeline", label: "Active Pipeline" },
];

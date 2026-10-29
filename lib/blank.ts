import type { CompInput, DealInput, InvestorInput, Priority } from "@/lib/types";

export function blankDeal(overrides: Partial<DealInput> = {}): DealInput {
  return {
    status: "follow_up",
    listingId: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    county: "",
    listPrice: null,
    beds: null,
    baths: null,
    livingSqft: null,
    lotSqft: null,
    stories: null,
    yearBuilt: null,
    garage: "",
    daysOnMarket: null,
    cdom: null,
    condition: "",
    propertyType: "",
    agentName: "",
    agentPhone: "",
    agentOffice: "",
    agentEmail: "",
    agentNotes: "",
    sourcePdfPath: null,
    photos: [],
    extracted: null,
    ...overrides,
  };
}

export function blankInvestor(overrides: Partial<InvestorInput> = {}): InvestorInput {
  return {
    priority: "warm",
    fullName: "",
    phone: "",
    email: "",
    investorType: "",
    preferredCounties: [],
    preferredCities: [],
    priceMin: null,
    priceMax: null,
    funding: "",
    crmLink: "",
    notes: "",
    ...overrides,
  };
}

export function blankComp(overrides: Partial<CompInput> = {}): CompInput {
  return {
    address: "",
    city: "",
    state: "",
    zip: "",
    salePrice: null,
    sqft: null,
    beds: null,
    baths: null,
    soldDate: "",
    dom: null,
    condition: "",
    stories: null,
    sourcePdfPath: null,
    ...overrides,
  };
}

export function isPriority(value: string): value is Priority {
  return value === "hot" || value === "warm" || value === "cold";
}

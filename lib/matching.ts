import type { Investor, MatchPage } from "@/lib/types";

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s+county$/, "");
}

export function investorMatchesPage(investor: Investor, page: MatchPage): boolean {
  const hasMin = investor.priceMin != null;
  const hasMax = investor.priceMax != null;
  if (hasMin || hasMax) {
    if (page.listPrice == null) return false;
    if (hasMin && page.listPrice < investor.priceMin!) return false;
    if (hasMax && page.listPrice > investor.priceMax!) return false;
  }

  const cities = investor.preferredCities.map(norm).filter(Boolean);
  const counties = investor.preferredCounties.map(norm).filter(Boolean);
  if (cities.length === 0 && counties.length === 0) return true;

  const cityHit = page.city ? cities.includes(norm(page.city)) : false;
  const countyHit = page.county ? counties.includes(norm(page.county)) : false;
  return cityHit || countyHit;
}

export type MatchResult = {
  recipients: { investor: Investor; pages: MatchPage[] }[];
  skippedNoEmail: { investor: Investor; pages: MatchPage[] }[];
  unmatchedPages: MatchPage[];
};

export function matchInvestors(investors: Investor[], pages: MatchPage[]): MatchResult {
  const recipients: MatchResult["recipients"] = [];
  const skippedNoEmail: MatchResult["skippedNoEmail"] = [];
  const matchedPageIds = new Set<string>();

  for (const investor of investors) {
    const matched = pages.filter((page) => investorMatchesPage(investor, page));
    if (!matched.length) continue;
    matched.forEach((page) => matchedPageIds.add(page.id));
    if (!investor.email.trim()) {
      skippedNoEmail.push({ investor, pages: matched });
      continue;
    }
    recipients.push({ investor, pages: matched });
  }

  return {
    recipients,
    skippedNoEmail,
    unmatchedPages: pages.filter((page) => !matchedPageIds.has(page.id)),
  };
}

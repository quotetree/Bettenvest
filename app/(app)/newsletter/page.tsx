import { Composer } from "@/components/newsletter/Composer";
import { store } from "@/lib/store";
import type { MatchPage } from "@/lib/types";

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ select?: string }>;
}) {
  const params = await searchParams;
  const [pages, investors] = await Promise.all([store.listLandingPages(), store.listInvestors()]);
  const matchPages: MatchPage[] = pages
    .filter((page) => page.status === "active")
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
  return <Composer pages={matchPages} investors={investors} preselectAll={params.select === "all"} />;
}

import { LandingGrid } from "@/components/landing/LandingGrid";
import { store } from "@/lib/store";

export default async function LandingPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [all, workspace] = await Promise.all([store.listLandingPages(), store.getWorkspace()]);
  const query = (params.q ?? "").trim().toLowerCase();
  const city = params.city ?? "";
  const status = params.status ?? "";
  const pages = all.filter((page) => {
    const haystack = `${page.deal.street} ${page.deal.city} ${page.deal.zip}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (city && page.deal.city !== city) return false;
    if (status && page.status !== status) return false;
    return true;
  });
  const cities = [...new Set(all.map((page) => page.deal.city).filter(Boolean))].sort();
  return (
    <LandingGrid
      pages={pages}
      cities={cities}
      query={params.q ?? ""}
      city={city}
      status={status}
      initials={workspace.ownerInitials}
    />
  );
}

import { LandingWizard } from "@/components/landing/LandingWizard";
import { store } from "@/lib/store";

export default async function NewLandingPage() {
  const deals = await store.listDeals();
  return <LandingWizard mode="create" goDeals={deals.filter((deal) => deal.status === "go")} initialDeal={null} />;
}

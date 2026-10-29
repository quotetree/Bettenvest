import { DealTracker } from "@/components/deals/DealTracker";
import { store } from "@/lib/store";

export default async function DealTrackerPage() {
  const deals = await store.listDeals();
  return <DealTracker deals={deals} />;
}

import { InvestorTracker } from "@/components/investors/InvestorTracker";
import { store } from "@/lib/store";

export default async function InvestorsPage() {
  const investors = await store.listInvestors();
  return <InvestorTracker investors={investors} />;
}

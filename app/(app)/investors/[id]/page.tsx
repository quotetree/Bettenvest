import { notFound } from "next/navigation";
import { InvestorForm } from "@/components/investors/InvestorForm";
import { store } from "@/lib/store";

export default async function InvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investor = await store.getInvestor(id);
  if (!investor) notFound();
  return <InvestorForm investor={investor} />;
}

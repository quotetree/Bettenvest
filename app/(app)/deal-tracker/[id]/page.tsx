import { notFound } from "next/navigation";
import { DealForm } from "@/components/deals/DealForm";
import { store } from "@/lib/store";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await store.getDeal(id);
  if (!deal) notFound();
  return <DealForm deal={deal} />;
}

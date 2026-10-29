import { notFound } from "next/navigation";
import { LandingWizard } from "@/components/landing/LandingWizard";
import { store } from "@/lib/store";

export default async function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await store.getLandingPage(id);
  if (!page) notFound();
  return (
    <LandingWizard
      mode="edit"
      pageId={page.id}
      goDeals={[]}
      initialDeal={page.deal}
      initialComps={page.comps}
      initial={{
        arvMin: page.arvMin,
        arvMax: page.arvMax,
        category: page.rehabCategory,
        reason: page.rehabReason,
        narrative: page.narrative,
        rentMin: page.rentMin,
        rentMax: page.rentMax,
      }}
    />
  );
}

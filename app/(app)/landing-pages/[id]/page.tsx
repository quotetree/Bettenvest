import { notFound } from "next/navigation";
import { ActivityScreen } from "@/components/landing/ActivityScreen";
import { store } from "@/lib/store";

export default async function LandingActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await store.getLandingPage(id);
  if (!page) notFound();
  const activity = await store.getActivity(id);
  return <ActivityScreen page={page} activity={activity} />;
}

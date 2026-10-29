import { NewsletterSidebar } from "@/components/newsletter/Sidebar";
import { store } from "@/lib/store";

export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  const campaigns = await store.listCampaigns();
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      <NewsletterSidebar campaigns={campaigns} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

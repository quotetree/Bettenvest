import { deliverCampaign } from "@/lib/email/deliver";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const due = await store.listDueCampaigns();
  const results = [];
  for (const campaign of due) {
    results.push({ id: campaign.id, ...(await deliverCampaign(campaign.id)) });
  }
  return Response.json({ results });
}

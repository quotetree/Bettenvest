import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    slug?: string;
    token?: string;
    visitorKey?: string;
  } | null;
  if (!body?.slug) return Response.json({ ok: false }, { status: 400 });
  const page = await store.getLandingPageBySlug(body.slug);
  if (!page) return Response.json({ ok: false }, { status: 404 });
  let investorId: string | null = null;
  if (body.token) {
    const recipient = await store.getRecipientByToken(body.token);
    if (recipient && recipient.matchedLandingPageIds.includes(page.id)) investorId = recipient.investorId;
  }
  await store.recordView({
    landingPageId: page.id,
    investorId,
    visitorKey: String(body.visitorKey || ""),
  });
  await store.addEvent({
    type: "link_viewed",
    title: `Link viewed: ${page.deal.street || "Landing page"}`,
    refType: "landing_page",
    refId: page.id,
  });
  return Response.json({ ok: true });
}

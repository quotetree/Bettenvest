import "server-only";

import { Resend } from "resend";
import { money } from "@/lib/format";
import { store } from "@/lib/store";
import type { LandingPageListItem } from "@/lib/types";

function origin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail(
  body: string,
  pages: LandingPageListItem[],
  token: string,
  appOrigin: string,
) {
  const intro = escapeHtml(body).replace(/\n/g, "<br>");
  const cards = pages
    .map((page) => {
      const place = [page.deal.city, page.deal.state].filter(Boolean).join(", ");
      const href = `${appOrigin}/p/${page.slug}?r=${encodeURIComponent(token)}`;
      return `<div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px">
        <div style="font-weight:700">${escapeHtml(page.deal.street || "Property")}</div>
        <div style="color:#475569">${escapeHtml(place)}</div>
        <div style="margin-top:8px">${escapeHtml(money(page.deal.listPrice))}</div>
        <a href="${href}" style="display:inline-block;margin-top:12px;color:#2563eb">View landing page</a>
      </div>`;
    })
    .join("");
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;line-height:1.5">${intro}${cards}</div>`;
}

export async function deliverCampaign(id: string): Promise<{ ok: true; note: string } | { ok: false; error: string }> {
  const campaign = await store.getCampaign(id);
  if (!campaign) return { ok: false, error: "Newsletter not found" };

  const appOrigin = origin();
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;
  const errors: string[] = [];
  let sent = 0;

  for (const recipient of campaign.recipients) {
    if (recipient.sentAt) continue;
    const pages = campaign.pages.filter((page) => recipient.matchedLandingPageIds.includes(page.id));
    if (!pages.length || !recipient.investor.email.trim()) continue;
    if (resend) {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Bettenvest <onboarding@resend.dev>",
        to: recipient.investor.email,
        subject: campaign.subject || "Properties that match your buying criteria",
        html: renderEmail(campaign.body, pages, recipient.token, appOrigin),
      });
      if (result.error) {
        errors.push(`${recipient.investor.email}: ${result.error.message}`);
        continue;
      }
    }
    await store.markRecipientSent(recipient.id);
    sent += 1;
  }

  if (errors.length) {
    return { ok: false, error: `Sent ${sent}. ${errors.join("; ")}` };
  }

  const note = resend
    ? `Sent to ${sent} investor${sent === 1 ? "" : "s"}.`
    : `Saved for ${sent} investor${sent === 1 ? "" : "s"}. Resend is not configured, so no email was delivered.`;
  await store.markCampaignSent(id, note);
  await store.addEvent({
    type: "email_sent",
    title: `Newsletter sent: ${campaign.subject || campaign.name}`,
    body: note,
    refType: "campaign",
    refId: id,
  });
  return { ok: true, note };
}

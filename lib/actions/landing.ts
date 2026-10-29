"use server";

import { extractComps } from "@/lib/ai/extract";
import { blankComp } from "@/lib/blank";
import { aiConfigured } from "@/lib/ai/openai";
import { pdfToText } from "@/lib/ai/pdf";
import { runUnderwritingModels } from "@/lib/ai/underwrite";
import { contentTypeFor } from "@/lib/files";
import { messageOf, slugify } from "@/lib/format";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import { saveBytes, readBytes } from "@/lib/storage";
import type { CompInput, RehabCategory } from "@/lib/types";
import { underwritingDollars } from "@/lib/underwriting/mao";

function filesOf(formData: FormData, key: string) {
  return formData.getAll(key).filter((file): file is File => file instanceof File && file.size > 0);
}

export async function extractCompPdfs(formData: FormData) {
  try {
    const files = filesOf(formData, "files");
    if (!files.length) return { ok: false as const, error: "Choose at least one comp PDF" };
    const comps: CompInput[] = [];
    const warnings: string[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const objectPath = `${crypto.randomUUID()}.pdf`;
      await saveBytes("comp-pdfs", objectPath, bytes, "application/pdf");
      let extracted: CompInput[] | null = null;
      try {
        const text = await pdfToText(bytes);
        extracted = await extractComps(text, objectPath);
        if (!extracted?.length) {
          warnings.push(
            aiConfigured()
              ? `${file.name} did not produce comps. A blank row was added.`
              : "OpenAI is not configured. Blank comp rows were added for you to fill in.",
          );
        }
      } catch (error) {
        warnings.push(`${file.name}: ${messageOf(error)}`);
      }
      if (extracted?.length) comps.push(...extracted);
      else comps.push(blankComp({ address: file.name.replace(/\.pdf$/i, ""), sourcePdfPath: objectPath }));
    }
    return { ok: true as const, comps, warnings };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function runUnderwritingAction(dealId: string, comps: CompInput[]) {
  try {
    const deal = await store.getDeal(dealId);
    if (!deal) return { ok: false as const, error: "Choose a subject property" };
    if (!aiConfigured()) {
      return {
        ok: true as const,
        ai: false,
        warning:
          "Add OPENAI_API_KEY to run the underwriting prompts. Enter the ARV range and rehab category, and the repair and MAO math will calculate from them.",
        arvMin: null,
        arvMax: null,
        narrative: "",
        category: null as RehabCategory | null,
        reason: "",
        repairs: null,
        maoMin: null,
        maoMax: null,
      };
    }
    const prompts = await store.getPrompts();
    const arvPrompt = prompts.find((prompt) => prompt.key === "arv")?.body ?? "";
    const repairPrompt = prompts.find((prompt) => prompt.key === "repairs_mao")?.body ?? "";
    const photos: string[] = [];
    for (const photo of deal.photos.slice(0, 4)) {
      const bytes = await readBytes("property-photos", photo);
      if (!bytes || bytes.byteLength > 1_500_000) continue;
      photos.push(`data:${contentTypeFor(photo)};base64,${Buffer.from(bytes).toString("base64")}`);
    }
    const result = await runUnderwritingModels({
      arvPrompt,
      repairPrompt,
      deal,
      comps,
      photos,
    });
    const dollars = underwritingDollars(deal.livingSqft, result.category, result.arvMin, result.arvMax);
    return {
      ok: true as const,
      ai: true,
      warning: result.category ? null : "The repair prompt did not return a rehab category. Choose one to calculate MAO.",
      ...result,
      repairs: dollars.repairs,
      maoMin: dollars.maoMin,
      maoMax: dollars.maoMax,
    };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

type LandingWrite = {
  dealId: string;
  city: string;
  county: string;
  listPrice: number | null;
  livingSqft: number | null;
  agentNotes: string;
  arvMin: number | null;
  arvMax: number | null;
  category: RehabCategory | null;
  reason: string;
  narrative: string;
  rentMin: number | null;
  rentMax: number | null;
  comps: CompInput[];
};

async function writeUnderwriting(input: LandingWrite) {
  const deal = await store.getDeal(input.dealId);
  if (!deal) return { ok: false as const, error: "Choose a subject property" };
  if (input.arvMin == null || input.arvMax == null || !input.category) {
    return { ok: false as const, error: "Enter an ARV range and a rehab category" };
  }
  if (input.arvMin > input.arvMax) {
    return { ok: false as const, error: "The low ARV needs to be below the high ARV" };
  }
  await store.updateDeal(deal.id, {
    status: "go",
    city: input.city,
    county: input.county,
    listPrice: input.listPrice,
    livingSqft: input.livingSqft,
    agentNotes: input.agentNotes,
  });
  const fresh = await store.getDeal(deal.id);
  if (!fresh) return { ok: false as const, error: "Deal not found" };
  const dollars = underwritingDollars(fresh.livingSqft, input.category, input.arvMin, input.arvMax);
  if (dollars.repairs == null) {
    return { ok: false as const, error: "Enter the living area so repairs can be calculated" };
  }
  return { ok: true as const, fresh, dollars };
}

export async function publishLanding(input: LandingWrite) {
  try {
    const written = await writeUnderwriting(input);
    if (!written.ok) return written;
    const page = await store.createLandingPage({
      dealId: written.fresh.id,
      slug: slugify(written.fresh.street, written.fresh.city),
      arvMin: input.arvMin,
      arvMax: input.arvMax,
      rehabCategory: input.category,
      rehabReason: input.reason,
      repairEstimate: written.dollars.repairs,
      maoMin: written.dollars.maoMin,
      maoMax: written.dollars.maoMax,
      rentMin: input.rentMin,
      rentMax: input.rentMax,
      narrative: input.narrative,
      comps: input.comps,
    });
    await store.addEvent({
      type: "upload_complete",
      title: `Landing page published: ${written.fresh.street || "Untitled property"}`,
      refType: "landing_page",
      refId: page.id,
    });
    refreshApp();
    return { ok: true as const, id: page.id, slug: page.slug };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function updateLanding(id: string, input: LandingWrite) {
  try {
    const written = await writeUnderwriting(input);
    if (!written.ok) return written;
    await store.updateLandingPage(id, {
      arvMin: input.arvMin,
      arvMax: input.arvMax,
      rehabCategory: input.category,
      rehabReason: input.reason,
      repairEstimate: written.dollars.repairs,
      maoMin: written.dollars.maoMin,
      maoMax: written.dollars.maoMax,
      rentMin: input.rentMin,
      rentMax: input.rentMax,
      narrative: input.narrative,
      comps: input.comps,
    });
    refreshApp();
    return { ok: true as const, id };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function deleteLanding(id: string) {
  try {
    await store.deleteLandingPage(id);
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function createOfferAction(input: {
  landingPageId: string;
  investorName: string;
  amount: number | null;
  terms: string;
  phone: string;
  email: string;
  notes: string;
  token?: string;
}) {
  try {
    if (!input.investorName.trim()) return { ok: false as const, error: "Enter the investor name" };
    if (input.amount == null) return { ok: false as const, error: "Enter an offer amount" };
    const page = await store.getLandingPage(input.landingPageId);
    if (!page) return { ok: false as const, error: "Landing page not found" };
    let investorId: string | null = null;
    if (input.token) {
      const recipient = await store.getRecipientByToken(input.token);
      if (recipient && recipient.matchedLandingPageIds.includes(page.id)) investorId = recipient.investorId;
    }
    if (!investorId && input.email.trim()) {
      const investors = await store.listInvestors();
      investorId =
        investors.find((investor) => investor.email.toLowerCase() === input.email.trim().toLowerCase())?.id ??
        null;
    }
    const offer = await store.createOffer({
      landingPageId: page.id,
      investorId,
      investorName: input.investorName.trim(),
      amount: input.amount,
      terms: input.terms,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
    });
    await store.addEvent({
      type: "offer",
      title: `Offer received: ${page.deal.street || "Landing page"}`,
      body: `${offer.investorName} offered ${offer.amount ?? ""}`,
      refType: "landing_page",
      refId: page.id,
    });
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

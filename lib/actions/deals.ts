"use server";

import { extractMls, mlsDeal } from "@/lib/ai/extract";
import { aiConfigured } from "@/lib/ai/openai";
import { pdfToText } from "@/lib/ai/pdf";
import { blankDeal } from "@/lib/blank";
import { contentTypeFor } from "@/lib/files";
import { messageOf } from "@/lib/format";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import { saveBytes } from "@/lib/storage";
import type { DealInput, DealStatus } from "@/lib/types";

function filesOf(formData: FormData, key: string) {
  return formData.getAll(key).filter((file): file is File => file instanceof File && file.size > 0);
}

export async function uploadMlsPdfs(formData: FormData) {
  try {
    const files = filesOf(formData, "files");
    if (!files.length) return { ok: false as const, error: "Choose at least one PDF" };
    const created: { deal: Awaited<ReturnType<typeof store.createDeal>> | null; warning: string }[] = [];
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        created.push({
          deal: null,
          warning: `${file.name} is over 20 MB and was skipped.`,
        });
        continue;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const objectPath = `${crypto.randomUUID()}.pdf`;
      await saveBytes("mls-pdfs", objectPath, bytes, "application/pdf");
      let input = blankDeal({ sourcePdfPath: objectPath });
      let warning = "";
      try {
        const text = await pdfToText(bytes);
        const extracted = await extractMls(text);
        if (extracted) input = mlsDeal(text, extracted, objectPath);
        else if (!aiConfigured()) {
          warning = "OpenAI is not configured, so this sheet was saved for you to fill in.";
        } else if (!text) {
          warning = "No readable text was found. Fill in the property card from the PDF.";
        } else {
          warning = "No listing facts were found. Fill in the property card from the PDF.";
        }
      } catch (error) {
        warning = messageOf(error);
      }
      const deal = await store.createDeal(input);
      created.push({ deal, warning });
    }
    const saved = created.filter((item) => item.deal);
    await store.addEvent({
      type: "upload_complete",
      title: `Uploaded ${saved.length} MLS ${saved.length === 1 ? "sheet" : "sheets"}`,
      refType: "deal",
    });
    refreshApp();
    return { ok: true as const, deals: created };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function createBlankDeal() {
  try {
    const deal = await store.createDeal(blankDeal());
    refreshApp();
    return { ok: true as const, id: deal.id };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function updateDealAction(id: string, patch: Partial<DealInput>) {
  try {
    const deal = await store.updateDeal(id, patch);
    refreshApp();
    return { ok: true as const, deal };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function updateDealStatus(id: string, status: DealStatus) {
  return updateDealAction(id, { status });
}

export async function deleteDealAction(id: string) {
  try {
    await store.deleteDeal(id);
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function addDealPhotos(dealId: string, formData: FormData) {
  try {
    const deal = await store.getDeal(dealId);
    if (!deal) return { ok: false as const, error: "Deal not found" };
    const files = filesOf(formData, "photos");
    if (!files.length) return { ok: false as const, error: "Choose at least one photo" };
    const photos = [...deal.photos];
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) continue;
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const objectPath = `${dealId}/${crypto.randomUUID()}.${extension}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await saveBytes("property-photos", objectPath, bytes, file.type || contentTypeFor(objectPath));
      photos.push(objectPath);
    }
    const updated = await store.updateDeal(dealId, { photos });
    refreshApp();
    return { ok: true as const, photos: updated.photos };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function removeDealPhoto(dealId: string, photo: string) {
  try {
    const deal = await store.getDeal(dealId);
    if (!deal) return { ok: false as const, error: "Deal not found" };
    const updated = await store.updateDeal(dealId, {
      photos: deal.photos.filter((item) => item !== photo),
    });
    refreshApp();
    return { ok: true as const, photos: updated.photos };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

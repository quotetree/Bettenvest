import "server-only";

import { ARV_JSON_CONTRACT, REPAIR_JSON_CONTRACT } from "@/lib/prompts";
import type { CompInput, Deal, RehabCategory } from "@/lib/types";
import { normalizeCategory } from "@/lib/underwriting/mao";
import { jsonCompletion } from "@/lib/ai/openai";

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

function subjectBlock(deal: Deal, comps: CompInput[]) {
  return JSON.stringify(
    {
      subject: {
        street: deal.street,
        city: deal.city,
        state: deal.state,
        zip: deal.zip,
        county: deal.county,
        listPrice: deal.listPrice,
        beds: deal.beds,
        baths: deal.baths,
        livingSqft: deal.livingSqft,
        lotSqft: deal.lotSqft,
        stories: deal.stories,
        yearBuilt: deal.yearBuilt,
        garage: deal.garage,
        daysOnMarket: deal.daysOnMarket,
        cdom: deal.cdom,
        condition: deal.condition,
        propertyType: deal.propertyType,
        agentNotes: deal.agentNotes,
      },
      comps,
    },
    null,
    2,
  );
}

export async function runUnderwritingModels(input: {
  arvPrompt: string;
  repairPrompt: string;
  deal: Deal;
  comps: CompInput[];
  photos: string[];
}): Promise<{
  arvMin: number | null;
  arvMax: number | null;
  narrative: string;
  category: RehabCategory | null;
  reason: string;
}> {
  const facts = subjectBlock(input.deal, input.comps);
  const photoNote = input.photos.length
    ? "Subject photos are attached."
    : "No subject photos were attached. Use the property facts and condition notes.";

  const [arv, repair] = await Promise.all([
    jsonCompletion(`${input.arvPrompt}\n\n${ARV_JSON_CONTRACT}`, facts),
    jsonCompletion(
      `${input.repairPrompt}\n\n${REPAIR_JSON_CONTRACT}`,
      `${photoNote}\n\n${facts}`,
      input.photos,
    ),
  ]);

  if (!arv || !repair) throw new Error("The underwriting model did not respond");

  let arvMin = number(arv.arv_min);
  let arvMax = number(arv.arv_max);
  if (arvMin != null && arvMax != null && arvMin > arvMax) {
    const swap = arvMin;
    arvMin = arvMax;
    arvMax = swap;
  }

  return {
    arvMin,
    arvMax,
    narrative: typeof arv.narrative === "string" ? arv.narrative.trim() : "",
    category: normalizeCategory(typeof repair.category === "string" ? repair.category : null),
    reason: typeof repair.reason === "string" ? repair.reason.trim() : "",
  };
}

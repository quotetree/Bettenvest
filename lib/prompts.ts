import type { PromptKey, UnderwritingPrompt } from "@/lib/types";

export const PROMPT_TITLES: Record<PromptKey, string> = {
  arv: "ARV Analysis & Comparable Property Evaluation",
  repairs_mao: "Repair Estimates and MAO calculation",
};

export const DEFAULT_PROMPT_BODIES: Record<PromptKey, string> = {
  arv: `I want you to create a ARV for a subject property.   Take the comparable properties that gets uploaded into the landing page tab of properties that have just sold.
Make sure when making your comparisons, evaluations , you are looking at things like listing price, days on market, bed/bath, condition, square footage, living space, stories, area is pretty much same across the board.
With that, I want to give us a ARV range of what appears buyers are willing to pay for properties like theirs in their market`,
  repairs_mao: `based off this comp and the following investment strategy (80% arv-repairs: MAO) what is the min arv and max arv, what is my mao.
During this calculation review the subject property photos and run my Repairs calculation
Step 1- Categorize it as either light, medium, or heavy remodel.
* Light rehab-$30 per SQFT: Carpet, paint, and minor cosmetic things.
* Average Rehab-$40 per SQFT: (Cosmetic/Surface Rehab)- Carpet, paint, bathrooms, and kitchen (cabinets and countertops); including electrical and plumbing fixtures.
* Heavy rehab-$50 per SQFT:, which can be a complete gut job, including roof, siding, windows, or it could be changing the floor plan, or doing an addition.
Step 2- Take price per sqft of the home and calculate the Per-square-foot price based off of the remodel category, then add 20%`,
};

export function defaultPrompts(now = new Date().toISOString()): UnderwritingPrompt[] {
  return (Object.keys(PROMPT_TITLES) as PromptKey[]).map((key) => ({
    key,
    title: PROMPT_TITLES[key],
    body: DEFAULT_PROMPT_BODIES[key],
    updatedAt: now,
  }));
}

export const ARV_JSON_CONTRACT = `Respond with JSON only, no markdown:
{"arv_min": number, "arv_max": number, "narrative": string}
arv_min and arv_max are whole dollars for the range buyers are paying. narrative is 2-4 sentences on how the sold comps support that range.`;

export const REPAIR_JSON_CONTRACT = `Respond with JSON only, no markdown:
{"category": "light" | "average" | "heavy", "reason": string}
Use "average" for a medium or cosmetic/surface rehab. reason is 1-3 sentences based on the photos and property facts. Do not calculate dollar amounts.`;

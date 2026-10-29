import type { RehabCategory } from "@/lib/types";

export const REHAB_RATES: Record<RehabCategory, number> = {
  light: 30,
  average: 40,
  heavy: 50,
};

export const REHAB_LABEL: Record<RehabCategory, string> = {
  light: "Light Rehab",
  average: "Average Rehab",
  heavy: "Heavy Rehab",
};

export function normalizeCategory(input: string | null | undefined): RehabCategory | null {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value.includes("heavy") || value.includes("gut")) return "heavy";
  if (value.includes("average") || value.includes("medium") || value.includes("surface")) {
    return "average";
  }
  if (value.includes("light") || value.includes("cosmetic")) return "light";
  return null;
}

export function repairEstimate(
  sqft: number | null,
  category: RehabCategory | null,
): number | null {
  if (sqft == null || sqft <= 0 || !category) return null;
  return Math.round(sqft * REHAB_RATES[category] * 1.2);
}

export function maoBound(arv: number | null, repairs: number | null): number | null {
  if (arv == null || repairs == null) return null;
  return Math.round(arv * 0.8 - repairs);
}

export function underwritingDollars(
  sqft: number | null,
  category: RehabCategory | null,
  arvMin: number | null,
  arvMax: number | null,
) {
  const repairs = repairEstimate(sqft, category);
  return {
    repairs,
    maoMin: maoBound(arvMin, repairs),
    maoMax: maoBound(arvMax, repairs),
  };
}

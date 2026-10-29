"use server";

import { blankInvestor, isPriority } from "@/lib/blank";
import { parseCsv, pick } from "@/lib/csv";
import { messageOf, parseNumber } from "@/lib/format";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import type { InvestorInput, Priority } from "@/lib/types";

function splitList(value: string) {
  return value
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveInvestors(inputs: InvestorInput[]) {
  try {
    const valid = inputs.filter((investor) => investor.fullName.trim());
    if (!valid.length) return { ok: false as const, error: "Enter at least one investor name" };
    const created = await store.createInvestors(valid.map((investor) => blankInvestor(investor)));
    refreshApp();
    return { ok: true as const, count: created.length };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function importInvestorCsv(text: string) {
  try {
    const inputs = parseCsv(text).flatMap((row) => {
      const fullName = pick(row, ["full name", "name", "investor", "investor name"]);
      if (!fullName) return [];
      const priorityRaw = pick(row, ["priority"]).toLowerCase();
      const priority: Priority = isPriority(priorityRaw) ? priorityRaw : "warm";
      let priceMin = parseNumber(pick(row, ["price min", "min price", "price_min"]));
      let priceMax = parseNumber(pick(row, ["price max", "max price", "price_max"]));
      const range = pick(row, ["price range", "price"]);
      if (priceMin == null && priceMax == null && range.includes("-")) {
        const [min, max] = range.split(/\s*(?:-|–|to)\s*/);
        priceMin = parseNumber(min ?? "");
        priceMax = parseNumber(max ?? "");
      }
      return [
        blankInvestor({
          priority,
          fullName,
          phone: pick(row, ["phone", "phone number"]),
          email: pick(row, ["email"]),
          investorType: pick(row, ["investor type", "type"]),
          preferredCounties: splitList(pick(row, ["preferred counties", "counties", "county"])),
          preferredCities: splitList(pick(row, ["preferred cities", "cities", "city"])),
          priceMin,
          priceMax,
          funding: pick(row, ["funding"]),
          crmLink: pick(row, ["crm link", "crm", "crm url"]),
          notes: pick(row, ["notes", "note"]),
        }),
      ];
    });
    if (!inputs.length) {
      return { ok: false as const, error: "No investors found. Include a Full Name column." };
    }
    const created = await store.createInvestors(inputs);
    refreshApp();
    return { ok: true as const, count: created.length };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function updateInvestorAction(id: string, patch: Partial<InvestorInput>) {
  try {
    const investor = await store.updateInvestor(id, patch);
    refreshApp();
    return { ok: true as const, investor };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function updateInvestorPriority(id: string, priority: Priority) {
  return updateInvestorAction(id, { priority });
}

export async function deleteInvestorAction(id: string) {
  try {
    await store.deleteInvestor(id);
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

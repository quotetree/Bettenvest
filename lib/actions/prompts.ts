"use server";

import { messageOf } from "@/lib/format";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import type { PromptKey } from "@/lib/types";

export async function getPromptsAction() {
  try {
    const prompts = await store.getPrompts();
    return { ok: true as const, prompts };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function savePromptAction(key: PromptKey, body: string) {
  try {
    await store.savePrompt(key, body);
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function resetPromptsAction() {
  try {
    await store.resetPrompts();
    refreshApp();
    const prompts = await store.getPrompts();
    return { ok: true as const, prompts };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

"use server";

import { PIPELINE_STAGES } from "@/lib/constants";
import { messageOf } from "@/lib/format";
import { refreshApp } from "@/lib/refresh";
import { store } from "@/lib/store";
import type { PipelineStage } from "@/lib/types";

export async function movePipelineCardAction(cardId: string, stage: PipelineStage, index: number) {
  try {
    const before = await store.listPipeline();
    const card = before.find((item) => item.id === cardId);
    await store.movePipelineCard(cardId, stage, index);
    if (card && card.stage !== stage) {
      const label = PIPELINE_STAGES.find((item) => item.value === stage)?.label ?? stage;
      await store.addEvent({
        type: "pipeline_task",
        title: `${card.street} moved to ${label}`,
        refType: "pipeline",
        refId: card.landingPageId,
      });
    }
    refreshApp();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

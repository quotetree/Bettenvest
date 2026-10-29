import { PipelineBoard } from "@/components/pipeline/Board";
import { store } from "@/lib/store";

export default async function PipelinePage() {
  const cards = await store.listPipeline();
  return <PipelineBoard cards={cards} />;
}

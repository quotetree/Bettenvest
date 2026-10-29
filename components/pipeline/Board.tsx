"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Heart, Phone, Users } from "lucide-react";
import { movePipelineCardAction } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES } from "@/lib/constants";
import type { PipelineCardModel, PipelineStage } from "@/lib/types";

export function PipelineBoard({ cards }: { cards: PipelineCardModel[] }) {
  const router = useRouter();
  const [items, setItems] = useState(cards);
  const [message, setMessage] = useState("");
  useEffect(() => setItems(cards), [cards]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function cardsFor(stage: PipelineStage) {
    return items.filter((card) => card.stage === stage).sort((a, b) => a.position - b.position);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const moving = items.find((card) => card.id === activeId);
    if (!moving) return;
    const stageIds = PIPELINE_STAGES.map((stage) => stage.value);
    const overCard = items.find((card) => card.id === overId);
    const toStage = (stageIds.includes(overId as PipelineStage) ? overId : overCard?.stage) as PipelineStage | undefined;
    if (!toStage) return;
    const destination = cardsFor(toStage).filter((card) => card.id !== activeId);
    const overIndex = destination.findIndex((card) => card.id === overId);
    const index = overIndex < 0 ? destination.length : overIndex;
    const next = items.map((card) => (card.id === activeId ? { ...card, stage: toStage, position: index } : card));
    setItems(next);
    const result = await movePipelineCardAction(activeId, toStage, index);
    if (!result.ok) setMessage(result.error);
    else router.refresh();
  }

  function scroll(direction: number) {
    document.getElementById("pipeline-scroll")?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">Every landing page starts in Underwriting. Drag a card into the next stage.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Scroll left" className="grid h-10 w-10 place-items-center rounded-full border bg-white" onClick={() => scroll(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Scroll right" className="grid h-10 w-10 place-items-center rounded-full border bg-white" onClick={() => scroll(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {message ? <p className="mb-3 text-sm text-rose-600">{message}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(event) => void onDragEnd(event)}>
        <div id="pipeline-scroll" className="flex gap-4 overflow-x-auto pb-6">
          {PIPELINE_STAGES.map((stage) => (
            <Column key={stage.value} stage={stage.value} label={stage.label} header={stage.header} cards={cardsFor(stage.value)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Column({
  stage,
  label,
  header,
  cards,
}: {
  stage: PipelineStage;
  label: string;
  header: string;
  cards: PipelineCardModel[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const light = stage === "marketing";
  return (
    <section className="flex w-72 shrink-0 flex-col">
      <header className={`rounded-t-xl px-4 py-3 ${header} ${light ? "text-amber-950" : "text-white"}`}>
        <div className="font-semibold">{label}</div>
        <div className="text-sm opacity-80">
          {cards.length} {cards.length === 1 ? "Deal" : "Deals"}
        </div>
      </header>
      <div ref={setNodeRef} className={`min-h-[28rem] flex-1 space-y-3 rounded-b-xl bg-slate-200/80 p-3 ${isOver ? "outline outline-2 outline-blue-400" : ""}`}>
        <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <DealCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-8 text-center text-sm text-slate-400">
            Drag a deal here...
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DealCard({ card }: { card: PipelineCardModel }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  const place = [card.city, card.state, card.zip].filter(Boolean).join(", ");
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="cursor-grab rounded-xl bg-white p-3 shadow-sm active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/landing-pages/${card.landingPageId}`} className="font-semibold text-slate-900" onPointerDown={(event) => event.stopPropagation()}>
            {card.street}
          </Link>
          <p className="text-xs text-slate-500">{place}</p>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-[10px] font-semibold text-white">
          {card.initials}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 text-center text-[10px] uppercase tracking-wide text-slate-400">
        <span>Buyers</span>
        <span>Contacted</span>
        <span>Interested</span>
      </div>
      <div className="mt-1 grid grid-cols-3 text-center text-sm font-medium text-slate-700">
        <span className="inline-flex items-center justify-center gap-1">
          <Users size={12} /> {card.buyers}
        </span>
        <span className="inline-flex items-center justify-center gap-1">
          <Phone size={12} /> {card.contacted}
        </span>
        <span className="inline-flex items-center justify-center gap-1">
          <Heart size={12} /> {card.interested}
        </span>
      </div>
    </article>
  );
}

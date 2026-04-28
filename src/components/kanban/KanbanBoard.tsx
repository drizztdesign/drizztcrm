"use client";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDeals, useUpdateDealStage } from "@/lib/queries/deals";
import type { DealWithRelations, LeadStage } from "@/lib/supabase/types";
import { STAGE_ORDER, STAGE_META, groupByStage, dealValue } from "@/lib/domain";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { fmtEuro } from "@/lib/format";

export function KanbanBoard() {
  const { data: deals = [], isLoading } = useDeals();
  const updateStage = useUpdateDealStage();
  const { lang } = useT();
  const search = useUI((s) => s.search);
  const filters = useUI((s) => s.filters);
  const show = useUI((s) => s.showToast);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let out = deals;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.company?.name ?? "").toLowerCase().includes(q) ||
        (d.contact?.name ?? "").toLowerCase().includes(q) ||
        (d.company?.city ?? "").toLowerCase().includes(q)
      );
    }
    if (filters.stage !== "all") out = out.filter((d) => d.stage === filters.stage);
    if (filters.temp !== "all")  out = out.filter((d) => d.temp === filters.temp);
    if (filters.source !== "all") out = out.filter((d) => d.source === filters.source);
    return out;
  }, [deals, search, filters]);

  const columns = useMemo(() => groupByStage(filtered), [filtered]);
  const draggingDeal = useMemo(() => deals.find((d) => d.id === draggingId), [deals, draggingId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const activeId = String(active.id);

    // The drop target can be either a column (id = stage) or a card (id = deal.id).
    // If it's a card, we resolve to that card's stage so dropping over any card in
    // a column counts as dropping into the column.
    let newStage: LeadStage | null = STAGE_ORDER.includes(overId as LeadStage)
      ? (overId as LeadStage)
      : null;
    if (!newStage) {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) newStage = overDeal.stage;
    }
    if (!newStage) return;

    const deal = deals.find((d) => d.id === activeId);
    if (!deal || deal.stage === newStage) return;

    updateStage.mutate(
      { id: activeId, stage: newStage },
      {
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
        onSuccess: () => show(lang === "es" ? `Lead movido a ${STAGE_META[newStage!].labelEs}` : `Lead moved to ${STAGE_META[newStage!].labelEn}`, "ok"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 min-w-max h-full">
          {Array.from({ length: 6 }).map((_, col) => (
            <div key={col} className="w-[260px] flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>
              {Array.from({ length: col % 2 === 0 ? 3 : 2 }).map((_, card) => (
                <div key={card} className="bg-bg-1 border border-border rounded-[12px] p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-[22px] py-[18px] flex gap-[14px] items-stretch">
        {STAGE_ORDER.map((stage) => {
          const items = columns[stage] ?? [];
          const total = items.reduce((a, d) => a + dealValue(d), 0);
          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              items={items}
              lang={lang}
              totalLabel={fmtEuro(total, lang)}
            >
              <SortableContext items={items.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {items.map((d) => (
                  <LeadCard key={d.id} deal={d} />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {draggingDeal ? (
          <div className="rotate-[2deg] shadow-pop">
            <LeadCard deal={draggingDeal as DealWithRelations} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

"use client";
import { useMemo, useState } from "react";
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

    // Dropped into a column
    const newStage = STAGE_ORDER.includes(overId as LeadStage) ? (overId as LeadStage) : null;
    if (!newStage) return;

    const deal = deals.find((d) => d.id === activeId);
    if (!deal || deal.stage === newStage) return;

    updateStage.mutate(
      { id: activeId, stage: newStage },
      {
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
        onSuccess: () => show(lang === "es" ? `Lead movido a ${STAGE_META[newStage].labelEs}` : `Lead moved to ${STAGE_META[newStage].labelEn}`, "ok"),
      }
    );
  };

  if (isLoading) {
    return <div className="flex-1 grid place-items-center text-fg-2 text-sm">Cargando pipeline…</div>;
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

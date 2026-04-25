"use client";
import { useDroppable } from "@dnd-kit/core";
import type { LeadStage, DealWithRelations, Lang } from "@/lib/supabase/types";
import { STAGE_META } from "@/lib/domain";
import { cn } from "@/lib/cn";

export function KanbanColumn({
  stage,
  items,
  lang,
  totalLabel,
  children,
}: {
  stage: LeadStage;
  items: DealWithRelations[];
  lang: Lang;
  totalLabel: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];

  return (
    <div className="shrink-0 w-[300px] max-w-[300px] flex flex-col h-full min-h-0 rounded-xl bg-transparent">
      <div className="flex items-center gap-2 px-[10px] pt-2 pb-[10px] mb-2">
        <span
          className="w-[7px] h-[7px] rounded-[2px] bg-accent"
          style={{ boxShadow: "0 0 0 2px rgba(168, 255, 62, 0.15)" }}
        />
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-0">
          {lang === "es" ? meta.labelEs : meta.labelEn}
        </span>
        <span className="text-[10.5px] text-fg-2 bg-bg-2 border border-border rounded-md px-1.5 py-px tabular">
          {items.length}
        </span>
        <span className="ml-auto text-[10.5px] text-fg-2 tabular">{totalLabel}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto px-1.5 pb-5 flex flex-col gap-[var(--dens-gap)] rounded-xl transition-colors",
          isOver && "bg-accent-soft/50"
        )}
      >
        {children}
        {items.length === 0 && (
          <div className={cn(
            "rounded-lg border border-dashed border-border text-fg-3 text-[11px] p-5 text-center",
            isOver && "border-accent text-accent"
          )}>
            {lang === "es" ? "Suelta leads aquí" : "Drop leads here"}
          </div>
        )}
      </div>
    </div>
  );
}

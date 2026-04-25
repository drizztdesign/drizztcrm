"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DealWithRelations } from "@/lib/supabase/types";
import { TEMP_META, PROJECT_META, SOURCE_META, probabilityFor, dealValue } from "@/lib/domain";
import { fmtEuro, avatarGradient, daysBetween } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/useT";

export function LeadCard({ deal, overlay = false }: { deal: DealWithRelations; overlay?: boolean }) {
  const { lang } = useT();
  const openDeal = useUI((s) => s.openDeal);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: deal.id, disabled: overlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prob = probabilityFor(deal);
  const value = dealValue(deal);
  const daysInStage = daysBetween(deal.stage_entered_at, new Date());
  const stalled = daysInStage > 10 && deal.stage !== "cerrado";
  const urgent = deal.next_action_status === "urgent" || deal.temp === "superhot";

  const onClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    openDeal(deal.id);
  };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onClick}
      className={cn(
        "bg-bg-1 border border-border rounded-xl p-[var(--dens-card-pad)] cursor-grab transition-colors relative shadow-card",
        "hover:border-border-strong",
        isDragging && !overlay && "opacity-40",
        urgent && "border-danger/50",
        stalled && !urgent && "border-warn/50",
      )}
    >
      <div className="flex items-center gap-2 mb-[10px]">
        <div
          className="w-[30px] h-[30px] rounded-[8px] grid place-items-center text-[11px] font-semibold text-white shrink-0"
          style={{ background: avatarGradient(deal.id) }}
        >
          {deal.contact?.avatar || deal.code.slice(-2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-fg-0 truncate">{deal.company?.name ?? deal.title}</div>
          <div className="text-[11.5px] text-fg-2 truncate">{deal.contact?.name ?? "—"}</div>
        </div>
        <span className={cn("dot ml-auto", TEMP_META[deal.temp].className)} />
      </div>

      <div className="flex flex-wrap gap-1 mb-[10px]">
        <span
          className="text-[10.5px] text-fg-1 bg-bg-2 border border-border rounded-[5px] px-1.5 py-0.5 flex items-center gap-1"
          style={{ borderLeftWidth: 2, borderLeftColor: PROJECT_META[deal.project_type].color }}
        >
          {lang === "es" ? PROJECT_META[deal.project_type].labelEs : PROJECT_META[deal.project_type].labelEn}
        </span>
        <span className="text-[10.5px] text-fg-1 bg-bg-2 border border-border rounded-[5px] px-1.5 py-0.5 flex items-center gap-1">
          <span>{SOURCE_META[deal.source].icon}</span>
          {lang === "es" ? SOURCE_META[deal.source].labelEs : SOURCE_META[deal.source].labelEn}
        </span>
        <span className="text-[10.5px] text-fg-1 bg-bg-2 border border-border rounded-[5px] px-1.5 py-0.5">
          score <strong className="text-fg-0 font-medium">{deal.score}</strong>
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="text-[18px] font-semibold -tracking-[0.01em] text-fg-0 tabular">
          {fmtEuro(value, lang)}
        </span>
        <span className="text-[10.5px] text-accent tabular ml-auto">
          {Math.round(prob * 100)}% · {fmtEuro(value * prob, lang)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 pt-[10px] border-t border-dashed border-border text-[11px] text-fg-2">
        <div className={cn("flex-1 min-w-0 truncate", urgent ? "text-danger font-medium" : "text-fg-1")}>
          {deal.next_action ?? (lang === "es" ? "Sin próxima acción" : "No next action")}
        </div>
        <span className={cn("tabular shrink-0", stalled && "text-warn")}>
          {daysInStage}d
        </span>
      </div>
    </div>
  );
}

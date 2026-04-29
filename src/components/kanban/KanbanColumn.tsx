"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Send, Globe, MessageCircle } from "lucide-react";
import type { LeadStage, DealWithRelations, Lang } from "@/lib/supabase/types";
import { STAGE_META, PROSPECTING_STAGES } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { BulkProspectDialog } from "./BulkProspectDialog";

const PROSPECT_ACTION: Record<string, { Icon: React.ElementType; labelEs: string; labelEn: string }> = {
  prospecto_email: { Icon: Send,          labelEs: "Enviar emails",  labelEn: "Send emails" },
  prospecto_web:   { Icon: Globe,         labelEs: "Abrir webs",     labelEn: "Open sites" },
  prospecto_frio:  { Icon: MessageCircle, labelEs: "WhatsApp",       labelEn: "WhatsApp" },
};

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const action = PROSPECTING_STAGES.includes(stage) ? PROSPECT_ACTION[stage] : null;
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
        {(() => {
          const hot = items.filter(d => d.temp === "superhot" || d.temp === "hot").length;
          return hot > 0 ? (
            <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-md px-1.5 py-px tabular">
              🔥 {hot}
            </span>
          ) : null;
        })()}
        <span className="ml-auto text-[10.5px] text-fg-2 tabular">{totalLabel}</span>
        {action && items.length > 0 && (
          <button
            onClick={() => setBulkOpen(true)}
            title={lang === "es" ? action.labelEs : action.labelEn}
            className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-accent-ink text-[10px] font-semibold hover:brightness-105 shrink-0"
          >
            <action.Icon size={10} strokeWidth={2} />
            {lang === "es" ? action.labelEs : action.labelEn}
          </button>
        )}
      </div>
      {bulkOpen && (
        <BulkProspectDialog stage={stage} items={items} onClose={() => setBulkOpen(false)} />
      )}
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

"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useAllTimeline } from "@/lib/queries/timeline";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import { TimelineList } from "@/components/lead/TimelineList";
import type { TimelineKind } from "@/lib/supabase/types";

const KINDS: { id: TimelineKind | "all"; labelEs: string; labelEn: string }[] = [
  { id: "all", labelEs: "Todas", labelEn: "All" },
  { id: "whatsapp", labelEs: "WhatsApp", labelEn: "WhatsApp" },
  { id: "email", labelEs: "Email", labelEn: "Email" },
  { id: "meeting", labelEs: "Reuniones", labelEn: "Meetings" },
  { id: "note", labelEs: "Notas", labelEn: "Notes" },
  { id: "proposal", labelEs: "Propuestas", labelEn: "Proposals" },
  { id: "payment", labelEs: "Pagos", labelEn: "Payments" },
];

export default function ActividadesPage() {
  const { data: events = [], isLoading } = useAllTimeline(100);
  const { t, lang } = useT();
  const [filter, setFilter] = useState<TimelineKind | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.kind === filter);
  }, [events, filter]);

  return (
    <>
      <Topbar title={t("nav_activity")} sub={lang === "es" ? "Todo lo que ha pasado en tus leads" : "Everything that happened"} />
      <div className="px-[22px] py-2.5 border-b border-border flex items-center gap-2 overflow-x-auto">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setFilter(k.id)}
            className={cn(
              "inline-flex items-center px-2.5 py-1 text-[11.5px] rounded-md border whitespace-nowrap",
              filter === k.id ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border hover:border-border-strong"
            )}
          >
            {lang === "es" ? k.labelEs : k.labelEn}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[900px] mx-auto w-full">
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start py-3 border-b border-border">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-[40px] mb-4 opacity-30">📭</div>
            <div className="text-[14px] font-medium text-fg-1 mb-1">
              {lang === "es" ? "Sin actividad" : "No activity"}
            </div>
            <div className="text-[12.5px] text-fg-2">
              {filter === "all"
                ? (lang === "es" ? "Las interacciones con tus leads aparecerán aquí." : "Interactions with your leads will appear here.")
                : (lang === "es" ? `Sin actividad de tipo "${filter}" todavía.` : `No "${filter}" activity yet.`)}
            </div>
          </div>
        )}
        {!isLoading && <TimelineList events={filtered} />}
      </div>
    </>
  );
}

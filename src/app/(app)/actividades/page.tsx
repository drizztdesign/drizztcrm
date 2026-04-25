"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useAllTimeline } from "@/lib/queries/timeline";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
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
        {isLoading && <div className="text-fg-2">Cargando…</div>}
        {!isLoading && <TimelineList events={filtered} />}
      </div>
    </>
  );
}

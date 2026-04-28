"use client";
import { Topbar } from "@/components/layout/Topbar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useDeals } from "@/lib/queries/deals";
import { pipelineTotals } from "@/lib/domain";
import { fmtEuro } from "@/lib/format";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";

export default function PipelinePage() {
  const { data: deals = [] } = useDeals();
  const { t, lang } = useT();
  const totals = pipelineTotals(deals);

  return (
    <>
      <Topbar
        title={lang === "es" ? "Pipeline de ventas" : "Sales pipeline"}
        sub={t("pipeline_subtitle", { n: totals.count, total: fmtEuro(totals.total, lang) })}
      />
      {/* Stats bar */}
      <div className="px-[22px] py-2.5 border-b border-border flex items-center gap-4 overflow-x-auto bg-bg-1 shrink-0">
        <StatPill label={lang === "es" ? "Total pipeline" : "Total pipeline"} value={fmtEuro(totals.total, lang)} />
        <div className="w-px h-4 bg-border shrink-0" />
        <StatPill label={lang === "es" ? "Ponderado" : "Weighted"} value={fmtEuro(totals.weighted, lang)} accent />
        <div className="w-px h-4 bg-border shrink-0" />
        <StatPill label={lang === "es" ? "Leads activos" : "Active leads"} value={String(totals.count)} />
        <div className="w-px h-4 bg-border shrink-0" />
        <StatPill label={lang === "es" ? "Conversión" : "Conversion"} value={`${Math.round(totals.conversion * 100)}%`} />
        {totals.closedValue > 0 && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <StatPill label={lang === "es" ? "Cerrado mes" : "Closed month"} value={fmtEuro(totals.closedValue, lang)} />
          </>
        )}
      </div>
      <KanbanBoard />
    </>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10.5px] text-fg-2 whitespace-nowrap">{label}</span>
      <span className={cn("text-[13px] font-semibold tabular", accent ? "text-accent" : "text-fg-0")}>{value}</span>
    </div>
  );
}

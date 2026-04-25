"use client";
import { Topbar } from "@/components/layout/Topbar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useDeals } from "@/lib/queries/deals";
import { pipelineTotals } from "@/lib/domain";
import { fmtEuro } from "@/lib/format";
import { useT } from "@/lib/useT";

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
      <KanbanBoard />
    </>
  );
}

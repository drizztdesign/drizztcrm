"use client";
import { Topbar } from "@/components/layout/Topbar";
import { useDeals } from "@/lib/queries/deals";
import { pipelineTotals, STAGE_ORDER, STAGE_META, SOURCE_META } from "@/lib/domain";
import { fmtEuro } from "@/lib/format";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
import type { LeadSource } from "@/lib/supabase/types";

export default function DashboardPage() {
  const { data: deals = [] } = useDeals();
  const { t, lang } = useT();

  const totals = pipelineTotals(deals);

  // Funnel counts
  const bystage = STAGE_ORDER.map((s) => ({
    stage: s,
    count: deals.filter((d) => d.stage === s).length,
    value: deals.filter((d) => d.stage === s).reduce((a, d) => a + (d.price_offered ?? d.price_estimated ?? 0), 0),
  }));
  const maxCount = Math.max(1, ...bystage.map((x) => x.count));

  // By source
  const sources = (Object.keys(SOURCE_META) as LeadSource[]).map((src) => {
    const items = deals.filter((d) => d.source === src);
    const won = items.filter((d) => d.stage === "cerrado").length;
    return {
      src,
      count: items.length,
      won,
      rate: items.length ? won / items.length : 0,
      value: items.filter((d) => d.stage === "cerrado").reduce((a, d) => a + (d.price_closed ?? d.price_offered ?? 0), 0),
    };
  }).filter((x) => x.count > 0).sort((a, b) => b.value - a.value);

  return (
    <>
      <Topbar title={t("nav_dashboard")} sub={lang === "es" ? "Salud del negocio · Drizzt Design" : "Business health · Drizzt Design"} />
      <div className="flex-1 overflow-auto p-4 sm:p-[28px_32px] max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 mb-6">
          <Kpi label={t("kpi_pipeline")}     value={fmtEuro(totals.total, lang)}                     trend={totals.total > 0 ? "up" : "neutral"} />
          <Kpi label={t("kpi_weighted")}     value={fmtEuro(totals.weighted, lang)}   accent          trend={totals.weighted > 0 ? "up" : "neutral"} />
          <Kpi label={t("kpi_closed_month")} value={fmtEuro(totals.closedValue, lang)}                trend={totals.closedValue > 0 ? "up" : "neutral"} />
          <Kpi label={t("kpi_conversion")}   value={`${Math.round(totals.conversion * 100)}%`}        trend={totals.conversion > 0.2 ? "up" : totals.conversion > 0 ? "neutral" : "down"} />
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-6 max-[1100px]:grid-cols-1">
          <Panel title={lang === "es" ? "Embudo por etapa" : "Funnel by stage"}>
            <div>
              {bystage.map((row) => (
                <div key={row.stage} className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border last:border-b-0">
                  <span className="w-[120px] text-fg-1 text-[13px]">
                    {lang === "es" ? STAGE_META[row.stage].labelEs : STAGE_META[row.stage].labelEn}
                  </span>
                  <div className="flex-1 h-2 bg-bg-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(row.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-[35px] text-right text-fg-3 text-[11px] tabular">
                    {maxCount > 0 ? `${Math.round((row.count / maxCount) * 100)}%` : "0%"}
                  </span>
                  <span className="w-[80px] text-right text-fg-2 tabular text-[13px]">{row.count}</span>
                  <span className="w-[90px] text-right font-medium tabular text-[13px]">{fmtEuro(row.value, lang)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={lang === "es" ? "Origen de leads (cerrados)" : "Leads by source (won)"}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">
                  <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1">Origen</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1">Leads</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1">Won</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1">Conv.</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1">€</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.src} className="border-b border-border last:border-b-0">
                    <td className="py-3 px-[14px] text-fg-1">
                      <span className="mr-2">{SOURCE_META[s.src].icon}</span>
                      {lang === "es" ? SOURCE_META[s.src].labelEs : SOURCE_META[s.src].labelEn}
                    </td>
                    <td className="py-3 px-[14px] text-right text-fg-2 tabular">{s.count}</td>
                    <td className="py-3 px-[14px] text-right text-ok tabular">{s.won}</td>
                    <td className="py-2.5 px-[14px] text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-[40px] h-1.5 bg-bg-3 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.round(s.rate * 100)}%` }} />
                        </div>
                        <span className="tabular text-[11.5px] text-fg-2">{Math.round(s.rate * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-[14px] text-right font-medium tabular">{fmtEuro(s.value, lang)}</td>
                  </tr>
                ))}
                {!sources.length && (
                  <tr><td colSpan={5} className="py-8 text-center text-fg-2">{lang === "es" ? "Sin datos aún." : "No data yet."}</td></tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, accent, trend }: { label: string; value: string; accent?: boolean; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="bg-bg-1 border border-border rounded-xl px-[14px] py-3 flex flex-col gap-1 relative overflow-hidden">
      <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em]">{label}</div>
      <div className={cn("text-[22px] font-semibold -tracking-[0.01em] tabular", accent && "text-accent")}>{value}</div>
      {trend && (
        <div className={cn(
          "text-[10px] font-medium flex items-center gap-0.5",
          trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-fg-3"
        )}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          {trend === "up" ? (accent ? "pipeline activo" : "este mes") : trend === "down" ? "vs mes anterior" : "estable"}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-1 border border-border rounded-[14px] overflow-hidden">
      <div className="px-[18px] py-3.5 border-b border-border">
        <h3 className="m-0 text-[13.5px] font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

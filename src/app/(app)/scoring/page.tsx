"use client";
import { Topbar } from "@/components/layout/Topbar";
import { useDeals } from "@/lib/queries/deals";
import { useScoringRules, useUpdateRule } from "@/lib/queries/templates";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { fmtEuro, avatarGradient } from "@/lib/format";

export default function ScoringPage() {
  const { data: deals = [] } = useDeals();
  const { data: rules = [] } = useScoringRules();
  const update = useUpdateRule();
  const openDeal = useUI((s) => s.openDeal);
  const { t, lang } = useT();

  const ranking = [...deals]
    .filter((d) => d.stage !== "lost")
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return (
    <>
      <Topbar title={t("nav_scoring")} sub={lang === "es" ? "Priorización automática con reglas" : "Auto-prioritization by rules"} />
      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[1400px] mx-auto w-full grid grid-cols-[1.3fr_1fr] gap-6 max-[1100px]:grid-cols-1">
        <Panel title={lang === "es" ? "Ranking de leads" : "Lead ranking"}>
          {ranking.map((d, i) => (
            <div
              key={d.id}
              onClick={() => openDeal(d.id)}
              className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border last:border-b-0 hover:bg-bg-2 cursor-pointer"
            >
              <div className="w-7 text-fg-3 tabular text-[12px]">#{i + 1}</div>
              <div
                className="w-8 h-8 rounded-lg text-[11px] font-semibold text-white grid place-items-center"
                style={{ background: avatarGradient(d.id) }}
              >
                {d.contact?.avatar || d.code.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{d.company?.name ?? d.title}</div>
                <div className="text-[11px] text-fg-2 truncate">{d.contact?.name ?? "—"}</div>
                <div className={cn(
                  "text-[10px] px-1 py-px rounded w-fit font-medium mt-0.5",
                  d.temp === "superhot" ? "bg-red-500/15 text-red-400" :
                  d.temp === "hot"      ? "bg-orange-500/15 text-orange-400" :
                  d.temp === "warm"     ? "bg-yellow-500/15 text-yellow-400" :
                  d.temp === "cold"     ? "bg-blue-500/10 text-blue-400" :
                                          "bg-bg-3 text-fg-3"
                )}>
                  {d.temp}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[13px] font-semibold text-accent tabular">{d.score}</span>
                <div className="w-[40px] h-1 bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.score >= 70 ? "bg-accent" : d.score >= 40 ? "bg-yellow-400" : "bg-fg-3"
                    )}
                    style={{ width: `${Math.min(d.score, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[12px] text-fg-2 tabular w-[80px] text-right">
                {fmtEuro(d.price_offered ?? d.price_estimated, lang)}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title={lang === "es" ? "Reglas de scoring" : "Scoring rules"}>
          {rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
              <button
                onClick={() => update.mutate({ id: r.id, patch: { enabled: !r.enabled } })}
                className={cn("switch", r.enabled && "on")}
                aria-label="toggle rule"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{r.name}</div>
                <div className="text-[11.5px] text-fg-2">
                  {lang === "es" ? r.description_es : r.description_en}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[32px] h-1.5 bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.min((r.weight / 30) * 100, 100)}%` }}
                  />
                </div>
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) => update.mutate({ id: r.id, patch: { weight: parseInt(e.target.value) || 0 } })}
                  className="w-[60px] h-8 bg-bg-2 border border-border rounded-md px-2 text-[12px] text-right tabular outline-none focus:border-accent"
                />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </>
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

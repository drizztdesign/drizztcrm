"use client";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDeals } from "@/lib/queries/deals";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { useAllTimeline } from "@/lib/queries/timeline";
import { useT } from "@/lib/useT";
import { pipelineTotals } from "@/lib/domain";
import { fmtEuro } from "@/lib/format";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { TimelineList } from "@/components/lead/TimelineList";
import type { LeadTemp } from "@/lib/supabase/types";
import { Flame, Zap, Calendar, Check } from "lucide-react";

export default function InicioPage() {
  const { data: deals = [], isLoading } = useDeals();
  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useAllTimeline(15);
  const { lang, t } = useT();

  if (isLoading) {
    return (
      <>
        <Topbar title={t("nav_home")} />
        <div className="flex-1 overflow-auto p-4 sm:p-[28px_32px] max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col gap-2 mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2.5 flex-wrap mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-bg-1 border border-border rounded-xl px-[14px] py-2.5 min-w-[170px] flex-1 max-w-[260px]">
                <Skeleton className="h-2.5 w-20 mb-2" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.2fr_1fr] gap-6 max-[1100px]:grid-cols-1">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-5">
                {Array.from({ length: 2 }).map((_, panel) => (
                  <div key={panel} className="bg-bg-1 border border-border rounded-[14px] overflow-hidden">
                    <div className="px-[18px] py-3.5 border-b border-border">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="py-2">
                      {Array.from({ length: 3 }).map((_, row) => (
                        <div key={row} className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border last:border-b-0">
                          <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
                          <div className="flex-1 flex flex-col gap-1">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const totals = pipelineTotals(deals);
  const todayTasks = tasks.filter((x) => !x.done && (x.due === "Hoy" || /^hoy/i.test(x.due)));
  const hotLeads = deals
    .filter((d) => (["superhot", "hot"] as LeadTemp[]).includes(d.temp) && d.stage !== "cerrado" && d.stage !== "lost")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const urgentActions = deals.filter((d) => d.next_action_status === "urgent");

  return (
    <>
      <Topbar title={t("nav_home")} sub={lang === "es" ? "Tu resumen diario" : "Your daily overview"} />
      <div className="flex-1 overflow-auto p-4 sm:p-[28px_32px] max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-5 gap-6 flex-wrap">
          <div>
            <h2 className="m-0 text-[28px] font-semibold -tracking-[0.02em]">
              {t("home_hello")}, <b className="text-accent font-semibold">Drizzt</b>.
            </h2>
            <div className="text-fg-2 text-[13.5px] mt-1">
              {t("home_hello_sub", { n: todayTasks.length, hot: hotLeads.length })}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 items-stretch flex-wrap mb-6">
          <Kpi label={t("kpi_pipeline")}     value={fmtEuro(totals.total, lang)} />
          <Kpi label={t("kpi_weighted")}     value={fmtEuro(totals.weighted, lang)} accent />
          <Kpi label={t("kpi_closed_month")} value={fmtEuro(totals.closedValue, lang)} />
          <Kpi label={t("kpi_conversion")}   value={`${Math.round(totals.conversion * 100)}%`} />
        </div>

        <div className="grid grid-cols-[1.2fr_1fr] gap-6 max-[1100px]:grid-cols-1">
          <div className="flex flex-col gap-5">
            <Panel
              title={t("urgent_actions")}
              count={urgentActions.length}
              icon={<Zap size={13} strokeWidth={1.5} />}
            >
              {urgentActions.length === 0 ? (
                <Empty note={lang === "es" ? "Nada urgente hoy. Gran trabajo." : "Nothing urgent today."} />
              ) : urgentActions.slice(0, 5).map((d) => (
                <UrgentRow key={d.id} deal={d} />
              ))}
            </Panel>

            <Panel title={t("today_tasks")} count={todayTasks.length} icon={<Calendar size={13} strokeWidth={1.5} />}>
              {todayTasks.length === 0 ? (
                <Empty note={lang === "es" ? "Sin tareas para hoy." : "No tasks today."} />
              ) : todayTasks.map((task) => <TaskRow key={task.id} task={task} />)}
            </Panel>
          </div>

          <div className="flex flex-col gap-5">
            <Panel title={t("hot_leads")} count={hotLeads.length} icon={<Flame size={13} strokeWidth={1.5} />}>
              {hotLeads.length === 0 ? (
                <Empty note={lang === "es" ? "Sin leads calientes." : "No hot leads."} />
              ) : hotLeads.map((d) => <HotLeadRow key={d.id} deal={d} />)}
            </Panel>

            <Panel title={t("activity_recent")}>
              <div className="p-4">
                <TimelineList events={events} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-bg-1 border border-border rounded-xl px-[14px] py-2.5 min-w-[170px] flex-1 max-w-[260px]">
      <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-1">{label}</div>
      <div className={cn("text-[20px] font-semibold -tracking-[0.01em] tabular", accent && "text-accent")}>{value}</div>
    </div>
  );
}

function Panel({ title, count, icon, children }: { title: string; count?: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-bg-1 border border-border rounded-[14px] overflow-hidden">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="m-0 text-[13.5px] font-semibold flex items-center gap-2">
          {icon}
          {title}
          {count != null && (
            <span className="text-[10.5px] bg-bg-3 text-fg-1 rounded-full px-[7px] py-0.5 tabular font-semibold">{count}</span>
          )}
        </h3>
      </div>
      <div className="py-2">{children}</div>
    </div>
  );
}

function Empty({ note }: { note: string }) {
  return <div className="p-6 text-center text-fg-2 text-[13px]">{note}</div>;
}

function UrgentRow({ deal }: { deal: { id: string; title: string; company?: { name?: string } | null; contact?: { name?: string } | null; next_action: string | null; next_action_date: string | null } }) {
  const openDeal = useUI((s) => s.openDeal);
  return (
    <div onClick={() => openDeal(deal.id)} className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-2">
      <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-fg-0 truncate">{deal.company?.name ?? deal.title}</div>
        <div className="text-[11.5px] text-fg-2 truncate">{deal.next_action}</div>
      </div>
      <span className="text-[11px] text-danger bg-danger/10 border border-danger/30 rounded-md px-2 py-0.5 tabular shrink-0">
        {deal.next_action_date ?? ""}
      </span>
    </div>
  );
}

function TaskRow({ task }: { task: { id: string; title: string; due: string; done: boolean; deal?: { id: string; title: string } | null } }) {
  const toggle = useToggleTask();
  const openDeal = useUI((s) => s.openDeal);

  return (
    <div className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-2">
      <button
        onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: task.id, done: !task.done }); }}
        className={cn(
          "w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-border-strong grid place-items-center shrink-0 hover:border-accent",
          task.done && "bg-accent border-accent"
        )}
      >
        {task.done && <Check size={11} strokeWidth={3} className="text-accent-ink" />}
      </button>
      <div className="flex-1 min-w-0" onClick={() => task.deal?.id && openDeal(task.deal.id)}>
        <div className={cn("text-[13px] font-medium truncate", task.done && "line-through text-fg-3")}>{task.title}</div>
        {task.deal && <div className="text-[11.5px] text-fg-2 truncate">{task.deal.title}</div>}
      </div>
      <span className="text-[11.5px] bg-bg-3 text-fg-1 rounded-md px-2 py-0.5 tabular shrink-0">{task.due}</span>
    </div>
  );
}

function HotLeadRow({ deal }: { deal: { id: string; score: number; temp: LeadTemp; company?: { name?: string } | null; contact?: { avatar?: string } | null; price_offered: number | null; price_estimated: number } }) {
  const openDeal = useUI((s) => s.openDeal);
  const { lang } = useT();
  const value = deal.price_offered ?? deal.price_estimated;
  return (
    <div onClick={() => openDeal(deal.id)} className="grid grid-cols-[40px_1fr_auto] gap-3 items-center px-[18px] py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-2">
      <div className="w-9 h-9 rounded-[10px] bg-bg-3 grid place-items-center font-semibold text-[12.5px]">
        {deal.contact?.avatar ?? "•"}
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium truncate">{deal.company?.name ?? "—"}</div>
        <div className="text-[11.5px] text-fg-2 flex gap-1.5 items-center mt-0.5">
          <span className={cn("dot", `dot-${deal.temp}`)} />
          <span>score {deal.score}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[14px] font-semibold tabular">{fmtEuro(value, lang)}</div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useAutomations, useToggleAutomation, useRunMyAutomations } from "@/lib/queries/templates";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Plus, Pencil, Play } from "lucide-react";
import { AutomationDialog } from "@/components/automations/AutomationDialog";
import type { Automation } from "@/lib/supabase/types";

export default function AutomatizacionesPage() {
  const { data: autos = [], isLoading } = useAutomations();
  const toggle = useToggleAutomation();
  const run = useRunMyAutomations();
  const show = useUI((s) => s.showToast);
  const { lang } = useT();

  const [editing, setEditing] = useState<Automation | null>(null);
  const [creating, setCreating] = useState(false);

  const triggerLabel = (a: Automation): string => {
    const t = a.trigger;
    const k = t.kind as string;
    const days = t.days ?? "?";
    const stage = t.stage as string | undefined;
    if (k === "noTouchFor") return lang === "es" ? `Sin actividad ${days}d${stage ? ` en ${stage}` : ""}` : `No activity ${days}d${stage ? ` in ${stage}` : ""}`;
    if (k === "daysInStage") return lang === "es" ? `${days}d en ${stage}` : `${days}d in ${stage}`;
    if (k === "stageAge") return lang === "es" ? `${days}d en cualquier etapa` : `${days}d in any stage`;
    if (k === "postStageEnter") return lang === "es" ? `Tras post-stage ${t.postStage}` : `After post-stage ${t.postStage}`;
    if (k === "tempIs") return lang === "es" ? `Temperatura = ${t.temp}` : `Temp = ${t.temp}`;
    if (k === "tagContains") return lang === "es" ? `Tag: ${t.tag}` : `Tag: ${t.tag}`;
    if (k === "sourceIn") return lang === "es" ? `Origen: ${(t.values as string[] | undefined)?.join(", ")}` : `Source: ${(t.values as string[] | undefined)?.join(", ")}`;
    if (k === "priceMin") return lang === "es" ? `Presupuesto ≥ ${t.min}€` : `Budget ≥ ${t.min}€`;
    if (k === "daysSinceCreated") return lang === "es" ? `Creado hace ${days}d${stage ? ` (${stage})` : ""}` : `Created ${days}d ago${stage ? ` (${stage})` : ""}`;
    return k;
  };

  const actionLabel = (a: Automation): string => {
    const k = a.action.kind as string;
    if (k === "markUrgent") return lang === "es" ? "→ Urgente" : "→ Urgent";
    if (k === "moveStage") return lang === "es" ? `→ Mover a ${a.action.stage}` : `→ Move to ${a.action.stage}`;
    if (k === "createTask") return lang === "es" ? `→ Tarea: ${a.action.taskTitle ?? a.name}` : `→ Task: ${a.action.taskTitle ?? a.name}`;
    if (k === "sendEmail") return lang === "es" ? `→ Email${a.action.templateId ? " (plantilla)" : " (genérico)"}` : `→ Email${a.action.templateId ? " (template)" : " (generic)"}`;
    if (k === "appendTimeline" || k === "suggestTemplate") return lang === "es" ? "→ Añadir nota" : "→ Append note";
    if (k === "adjustProbability") return lang === "es" ? "→ Resetear probabilidad" : "→ Reset probability";
    if (k === "setTemp") return lang === "es" ? `→ Temperatura = ${a.action.temp}` : `→ Temp = ${a.action.temp}`;
    if (k === "addTag") return lang === "es" ? `→ + tag ${a.action.tag}` : `→ + tag ${a.action.tag}`;
    if (k === "removeTag") return lang === "es" ? `→ − tag ${a.action.tag}` : `→ − tag ${a.action.tag}`;
    return k;
  };

  const fmtRelative = (iso: string | null | undefined): string => {
    if (!iso) return lang === "es" ? "nunca" : "never";
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.round(ms / 60000);
    if (min < 1) return lang === "es" ? "ahora" : "just now";
    if (min < 60) return `${min}m`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    return `${d}d`;
  };

  const onRunNow = () => {
    run.mutate(undefined, {
      onSuccess: (n) => {
        show(
          n > 0
            ? (lang === "es" ? `${n} automatizaciones ejecutadas` : `${n} automations fired`)
            : (lang === "es" ? "Sin nada que ejecutar ahora" : "Nothing to run now"),
          "ok"
        );
      },
      onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
    });
  };

  return (
    <>
      <Topbar
        title={lang === "es" ? "Automatizaciones" : "Automations"}
        sub={lang === "es" ? `${autos.filter((a) => a.enabled).length} activas` : `${autos.filter((a) => a.enabled).length} active`}
      />
      <div className="px-3 sm:px-[22px] py-2.5 border-b border-border flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105"
        >
          <Plus size={14} strokeWidth={2} />
          {lang === "es" ? "Nueva" : "New"}
        </button>
        <button
          onClick={onRunNow}
          disabled={run.isPending}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium hover:border-border-strong disabled:opacity-60"
        >
          {run.isPending ? (
            <svg className="animate-spin w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <Play size={13} strokeWidth={1.8} />
          )}
          {run.isPending ? (lang === "es" ? "Ejecutando…" : "Running…") : (lang === "es" ? "Ejecutar ahora" : "Run now")}
        </button>
        <span className="text-[11px] text-fg-3 ml-auto">
          {lang === "es" ? "Se ejecutan solas cada hora" : "Auto-runs every hour"}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[900px] mx-auto w-full">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-1 border border-border rounded-[12px] p-4 flex items-center gap-4">
                <Skeleton className="w-8 h-5 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-20 shrink-0" />
                <Skeleton className="h-3 w-20 shrink-0" />
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {autos.map((a) => (
            <div key={a.id} className="bg-bg-1 border border-border rounded-xl p-4 flex items-start gap-3.5 group">
              <div className="w-[42px] h-[42px] rounded-[10px] bg-bg-3 grid place-items-center text-[20px] shrink-0">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium mb-1">{a.name}</div>
                <div className="text-[11.5px] text-fg-2 leading-[1.5] mb-2">
                  {(lang === "es" ? a.description_es : a.description_en) || (lang === "es" ? a.description_es : a.description_en)}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10.5px] mono">
                  <span className="bg-bg-3 border border-border rounded px-1.5 py-0.5 text-fg-1">{triggerLabel(a)}</span>
                  <span className="bg-bg-3 border border-border rounded px-1.5 py-0.5 text-fg-2">{actionLabel(a)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 mr-2">
                <div className="text-[11px] text-fg-2 text-right">
                  <b className="block text-fg-0 text-[14px] font-semibold tabular">{(a.stats?.fires ?? 0)}</b>
                  {lang === "es" ? "ejecuciones" : "runs"}
                </div>
                {(() => {
                  const rel = fmtRelative(a.last_run_at);
                  const isRecent = a.last_run_at && (Date.now() - new Date(a.last_run_at).getTime()) < 60 * 60 * 1000;
                  return (
                    <div className={cn(
                      "text-[10px] mono",
                      isRecent ? "text-accent font-medium" : "text-fg-3"
                    )}>
                      {lang === "es" ? "última: " : "last: "}{rel}
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setEditing(a)}
                  className="p-2 rounded-md text-fg-3 hover:text-accent hover:bg-bg-3 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Edit automation"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => toggle.mutate({ id: a.id, enabled: !a.enabled })}
                  className={cn("switch", a.enabled && "on")}
                  aria-label="toggle automation"
                />
              </div>
            </div>
          ))}
          {!isLoading && autos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="text-[48px] opacity-20">⚡</div>
              <div className="text-[14px] font-medium text-fg-1">
                {lang === "es" ? "Sin automatizaciones" : "No automations yet"}
              </div>
              <div className="text-[12.5px] text-fg-2 max-w-[300px]">
                {lang === "es"
                  ? "Las automatizaciones ejecutan acciones en tus leads automáticamente según reglas que tú defines."
                  : "Automations run actions on your leads automatically based on rules you define."}
              </div>
              <button
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold hover:opacity-90"
              >
                <Plus size={13} />
                {lang === "es" ? "Crear primera automatización" : "Create first automation"}
              </button>
            </div>
          )}
        </div>
      </div>

      <AutomationDialog
        automation={editing}
        isNew={creating}
        onClose={() => { setEditing(null); setCreating(false); }}
      />
    </>
  );
}

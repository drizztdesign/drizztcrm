"use client";
import { useEffect, useState } from "react";
import { X, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useCreateAutomation, useUpdateAutomation, useDeleteAutomation, useTemplates } from "@/lib/queries/templates";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { STAGE_ORDER, STAGE_META } from "@/lib/domain";
import { cn } from "@/lib/cn";
import type { Automation, LeadStage, TaskKind } from "@/lib/supabase/types";

type TriggerKind =
  | "noTouchFor"
  | "daysInStage"
  | "stageAge"
  | "postStageEnter"
  | "tempIs"
  | "tagContains"
  | "sourceIn"
  | "priceMin"
  | "daysSinceCreated";

type ActionKind =
  | "markUrgent"
  | "moveStage"
  | "createTask"
  | "sendEmail"
  | "appendTimeline"
  | "adjustProbability"
  | "setTemp"
  | "addTag"
  | "removeTag";

const TRIGGER_LABELS: Record<TriggerKind, { es: string; en: string }> = {
  noTouchFor: { es: "Sin actividad N días", en: "No activity for N days" },
  daysInStage: { es: "N días en una etapa concreta", en: "N days in a specific stage" },
  stageAge: { es: "N días en cualquier etapa activa", en: "N days in any active stage" },
  postStageEnter: { es: "Tras entrar en post-stage (entregada, etc)", en: "After entering post-stage" },
  tempIs: { es: "Temperatura del lead es…", en: "Lead temperature is…" },
  tagContains: { es: "Tiene un tag concreto", en: "Has a specific tag" },
  sourceIn: { es: "Origen entre varios", en: "Source in list" },
  priceMin: { es: "Presupuesto ≥ X €", en: "Budget ≥ X €" },
  daysSinceCreated: { es: "N días desde que se creó", en: "N days since created" },
};

const ACTION_LABELS: Record<ActionKind, { es: string; en: string }> = {
  markUrgent: { es: "Marcar como urgente", en: "Mark as urgent" },
  moveStage: { es: "Mover a otra etapa", en: "Move to another stage" },
  createTask: { es: "Crear tarea", en: "Create task" },
  sendEmail: { es: "Enviar email (con plantilla)", en: "Send email (using template)" },
  appendTimeline: { es: "Añadir nota al timeline", en: "Append timeline note" },
  adjustProbability: { es: "Resetear probabilidad", en: "Reset probability override" },
  setTemp: { es: "Cambiar temperatura", en: "Change temperature" },
  addTag: { es: "Añadir tag", en: "Add tag" },
  removeTag: { es: "Quitar tag", en: "Remove tag" },
};

const TASK_KINDS: TaskKind[] = ["call", "whatsapp", "email", "meeting", "note", "proposal", "payment"];

const POST_STAGES = ["desarrollo", "revision", "entregada", "mantenimiento", "finalizado", "recurrente"] as const;

const TEMPS = ["superhot", "hot", "warm", "cold", "lost"] as const;

const SOURCES = ["web", "instagram", "referido", "google", "email_frio", "llamada", "networking", "cliente_ant", "linkedin"] as const;

export function AutomationDialog({
  automation,
  isNew,
  onClose,
}: {
  automation: Automation | null;
  isNew: boolean;
  onClose: () => void;
}) {
  const { lang } = useT();
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const del = useDeleteAutomation();
  const show = useUI((s) => s.showToast);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🤖");
  const [descEs, setDescEs] = useState("");
  const [descEn, setDescEn] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [triggerKind, setTriggerKind] = useState<TriggerKind>("noTouchFor");
  const [trigDays, setTrigDays] = useState(2);
  const [trigStage, setTrigStage] = useState<LeadStage>("contactado");
  const [trigPostStage, setTrigPostStage] = useState<string>("entregada");
  const [trigTemp, setTrigTemp] = useState<string>("hot");
  const [trigTag, setTrigTag] = useState<string>("");
  const [trigSources, setTrigSources] = useState<string[]>(["referido", "cliente_ant"]);
  const [trigPriceMin, setTrigPriceMin] = useState<number>(4000);

  const [actionKind, setActionKind] = useState<ActionKind>("createTask");
  const [actMoveStage, setActMoveStage] = useState<LeadStage>("lost");
  const [actTaskKind, setActTaskKind] = useState<TaskKind>("note");
  const [actTaskTitle, setActTaskTitle] = useState("");
  const [actTemp, setActTemp] = useState<string>("warm");
  const [actTag, setActTag] = useState<string>("");
  const [actTemplateId, setActTemplateId] = useState<string>("");
  const { data: templates = [] } = useTemplates();
  const emailTemplates = templates.filter((t) => t.channel === "email");

  const [confirming, setConfirming] = useState(false);

  // AI suggest state — must be at top level (rules of hooks)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const open = automation !== null || isNew;

  useEffect(() => {
    if (!open) return;
    if (automation) {
      setName(automation.name);
      setIcon(automation.icon);
      setDescEs(automation.description_es);
      setDescEn(automation.description_en);
      setEnabled(automation.enabled);

      const tk = (automation.trigger.kind as TriggerKind) ?? "noTouchFor";
      setTriggerKind(tk);
      setTrigDays(Number(automation.trigger.days ?? 2));
      if (automation.trigger.stage) setTrigStage(automation.trigger.stage as LeadStage);
      if (automation.trigger.postStage) setTrigPostStage(String(automation.trigger.postStage));
      if (automation.trigger.temp) setTrigTemp(String(automation.trigger.temp));
      if (automation.trigger.tag) setTrigTag(String(automation.trigger.tag));
      if (Array.isArray(automation.trigger.values)) setTrigSources(automation.trigger.values as string[]);
      if (automation.trigger.min != null) setTrigPriceMin(Number(automation.trigger.min));

      const ak = (automation.action.kind as ActionKind) ?? "createTask";
      setActionKind(ak);
      if (automation.action.stage) setActMoveStage(automation.action.stage as LeadStage);
      if (automation.action.taskKind) setActTaskKind(automation.action.taskKind as TaskKind);
      if (automation.action.taskTitle) setActTaskTitle(String(automation.action.taskTitle));
      if (automation.action.temp) setActTemp(String(automation.action.temp));
      if (automation.action.tag) setActTag(String(automation.action.tag));
      if (automation.action.templateId) setActTemplateId(String(automation.action.templateId));
    } else {
      setName(""); setIcon("🤖"); setDescEs(""); setDescEn(""); setEnabled(true);
      setTriggerKind("noTouchFor"); setTrigDays(2); setTrigStage("contactado"); setTrigPostStage("entregada");
      setTrigTemp("hot"); setTrigTag(""); setTrigSources(["referido","cliente_ant"]); setTrigPriceMin(4000);
      setActionKind("createTask"); setActMoveStage("lost"); setActTaskKind("note"); setActTaskTitle("");
      setActTemp("warm"); setActTag(""); setActTemplateId("");
    }
    setConfirming(false);
  }, [automation, isNew, open]);

  if (!open) return null;

  const buildTrigger = (): Record<string, unknown> => {
    if (triggerKind === "noTouchFor") return { kind: "noTouchFor", days: trigDays, ...(trigStage ? { stage: trigStage } : {}) };
    if (triggerKind === "daysInStage") return { kind: "daysInStage", days: trigDays, stage: trigStage };
    if (triggerKind === "stageAge") return { kind: "stageAge", days: trigDays };
    if (triggerKind === "postStageEnter") return { kind: "postStageEnter", postStage: trigPostStage, days: trigDays };
    if (triggerKind === "tempIs") return { kind: "tempIs", temp: trigTemp };
    if (triggerKind === "tagContains") return { kind: "tagContains", tag: trigTag };
    if (triggerKind === "sourceIn") return { kind: "sourceIn", values: trigSources };
    if (triggerKind === "priceMin") return { kind: "priceMin", min: trigPriceMin };
    return { kind: "daysSinceCreated", days: trigDays, ...(trigStage ? { stage: trigStage } : {}) };
  };

  const buildAction = (): Record<string, unknown> => {
    if (actionKind === "markUrgent") return { kind: "markUrgent" };
    if (actionKind === "moveStage") return { kind: "moveStage", stage: actMoveStage };
    if (actionKind === "createTask") return { kind: "createTask", taskKind: actTaskKind, taskTitle: actTaskTitle.trim() || name };
    if (actionKind === "sendEmail") return { kind: "sendEmail", templateId: actTemplateId || null };
    if (actionKind === "appendTimeline") return { kind: "appendTimeline" };
    if (actionKind === "adjustProbability") return { kind: "adjustProbability" };
    if (actionKind === "setTemp") return { kind: "setTemp", temp: actTemp };
    if (actionKind === "addTag") return { kind: "addTag", tag: actTag.trim() };
    return { kind: "removeTag", tag: actTag.trim() };
  };

  const applyAiSuggestion = (s: {
    name?: string;
    icon?: string;
    description_es?: string;
    description_en?: string;
    trigger?: { kind?: string;[k: string]: unknown };
    action?: { kind?: string;[k: string]: unknown };
  }) => {
    if (s.name) setName(s.name);
    if (s.icon) setIcon(s.icon);
    if (s.description_es) setDescEs(s.description_es);
    if (s.description_en) setDescEn(s.description_en);

    if (s.trigger) {
      const tk = s.trigger.kind as TriggerKind;
      if (tk) setTriggerKind(tk);
      if (s.trigger.days != null) setTrigDays(Number(s.trigger.days));
      if (s.trigger.stage) setTrigStage(s.trigger.stage as LeadStage);
      if (s.trigger.postStage) setTrigPostStage(String(s.trigger.postStage));
      if (s.trigger.temp) setTrigTemp(String(s.trigger.temp));
      if (s.trigger.tag) setTrigTag(String(s.trigger.tag));
      if (Array.isArray(s.trigger.values)) setTrigSources(s.trigger.values as string[]);
      if (s.trigger.min != null) setTrigPriceMin(Number(s.trigger.min));
    }
    if (s.action) {
      const ak = s.action.kind as ActionKind;
      if (ak) setActionKind(ak);
      if (s.action.stage) setActMoveStage(s.action.stage as LeadStage);
      if (s.action.taskKind) setActTaskKind(s.action.taskKind as TaskKind);
      if (s.action.taskTitle) setActTaskTitle(String(s.action.taskTitle));
      if (s.action.temp) setActTemp(String(s.action.temp));
      if (s.action.tag) setActTag(String(s.action.tag));
    }
  };

  const runAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/automation-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, lang }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error");
      applyAiSuggestion(data.suggestion);
      setAiOpen(false);
      setAiPrompt("");
      show(lang === "es" ? "Sugerencia aplicada" : "Suggestion applied", "ok");
    } catch (err) {
      show(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      icon: icon || "🤖",
      description_es: descEs.trim(),
      description_en: descEn.trim() || descEs.trim(),
      enabled,
      trigger: buildTrigger(),
      action: buildAction(),
    };
    if (isNew) {
      create.mutate(payload, {
        onSuccess: () => { show(lang === "es" ? "Automatización creada" : "Automation created", "ok"); onClose(); },
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
      });
    } else if (automation) {
      update.mutate(
        { id: automation.id, patch: payload },
        {
          onSuccess: () => { show(lang === "es" ? "Automatización actualizada" : "Automation updated", "ok"); onClose(); },
          onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
        }
      );
    }
  };

  const onDelete = () => {
    if (!automation) return;
    del.mutate(automation.id, {
      onSuccess: () => { show(lang === "es" ? "Eliminada" : "Deleted", "ok"); onClose(); },
      onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
    });
  };

  const isPending = create.isPending || update.isPending;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 backdrop-enter" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[92vw] max-h-[90vh] bg-bg-1 border border-border rounded-2xl z-50 drawer-enter shadow-pop flex flex-col">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border shrink-0">
          <h2 className="m-0 text-[16px] font-semibold">
            {isNew ? (lang === "es" ? "Nueva automatización" : "New automation") : (lang === "es" ? "Editar automatización" : "Edit automation")}
          </h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto p-[18px_22px] flex flex-col gap-3.5 flex-1">
            {/* AI suggest */}
            <div className="border border-accent/30 rounded-lg bg-accent/5 p-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAiOpen((v) => !v)}
                className="flex items-center gap-2 text-[12.5px] font-semibold text-accent hover:brightness-110 self-start"
              >
                <Sparkles size={14} strokeWidth={1.8} />
                {aiOpen
                  ? (lang === "es" ? "Ocultar IA" : "Hide AI")
                  : (lang === "es" ? "Describir con lenguaje natural (IA)" : "Describe in natural language (AI)")}
              </button>
              {aiOpen && (
                <div className="flex flex-col gap-2">
                  <textarea
                    autoFocus
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder={lang === "es"
                      ? "Ej: cuando un lead lleve 5 días sin tocar y esté en propuesta, márcalo urgente"
                      : "e.g. when a lead has been untouched 5 days in proposal stage, mark it urgent"}
                    className="rounded-lg bg-bg-2 border border-border px-3 py-2 text-[13.5px] outline-none focus:border-accent w-full resize-y"
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={runAiSuggest}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-60"
                    >
                      {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.8} />}
                      {aiLoading
                        ? (lang === "es" ? "Pensando…" : "Thinking…")
                        : (lang === "es" ? "Sugerir" : "Suggest")}
                    </button>
                    <span className="text-[10.5px] text-fg-3">
                      {lang === "es" ? "Rellena el formulario con tu idea" : "Fills the form with your idea"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[60px_1fr] gap-3">
              <Field label={lang === "es" ? "Icono" : "Icon"}>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-2 text-center text-[18px] outline-none focus:border-accent w-full"
                />
              </Field>
              <Field label={lang === "es" ? "Nombre" : "Name"}>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={lang === "es" ? "Ej: Recordar propuesta a 3 días" : "e.g. Remind proposal at 3 days"}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                />
              </Field>
            </div>

            <Field label={lang === "es" ? "Descripción" : "Description"}>
              <input
                value={descEs}
                onChange={(e) => setDescEs(e.target.value)}
                placeholder={lang === "es" ? "Qué hace, en una frase" : "What it does, in a sentence"}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>

            <div className="border border-border rounded-lg p-3 bg-bg-2/50 flex flex-col gap-3">
              <div className="text-[10.5px] font-semibold text-accent uppercase tracking-[0.1em]">
                {lang === "es" ? "Cuándo se dispara" : "When it fires"}
              </div>

              <Field label={lang === "es" ? "Tipo de disparador" : "Trigger type"}>
                <select
                  value={triggerKind}
                  onChange={(e) => setTriggerKind(e.target.value as TriggerKind)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  {(Object.keys(TRIGGER_LABELS) as TriggerKind[]).map((k) => (
                    <option key={k} value={k}>{lang === "es" ? TRIGGER_LABELS[k].es : TRIGGER_LABELS[k].en}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                {(triggerKind === "noTouchFor" ||
                  triggerKind === "daysInStage" ||
                  triggerKind === "stageAge" ||
                  triggerKind === "postStageEnter" ||
                  triggerKind === "daysSinceCreated") && (
                  <Field label={lang === "es" ? "Días" : "Days"}>
                    <input
                      type="number"
                      min={1}
                      value={trigDays}
                      onChange={(e) => setTrigDays(parseInt(e.target.value) || 1)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full tabular"
                    />
                  </Field>
                )}

                {(triggerKind === "noTouchFor" || triggerKind === "daysInStage" || triggerKind === "daysSinceCreated") && (
                  <Field label={lang === "es" ? "Etapa" : "Stage"}>
                    <select
                      value={trigStage}
                      onChange={(e) => setTrigStage(e.target.value as LeadStage)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    >
                      {(triggerKind === "noTouchFor" || triggerKind === "daysSinceCreated") && (
                        <option value="">{lang === "es" ? "(cualquiera)" : "(any)"}</option>
                      )}
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>{lang === "es" ? STAGE_META[s].labelEs : STAGE_META[s].labelEn}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {triggerKind === "postStageEnter" && (
                  <Field label={lang === "es" ? "Post-etapa" : "Post-stage"}>
                    <select
                      value={trigPostStage}
                      onChange={(e) => setTrigPostStage(e.target.value)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    >
                      {POST_STAGES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </Field>
                )}

                {triggerKind === "tempIs" && (
                  <Field label={lang === "es" ? "Temperatura" : "Temperature"}>
                    <select
                      value={trigTemp}
                      onChange={(e) => setTrigTemp(e.target.value)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full capitalize col-span-2"
                    >
                      {TEMPS.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                    </select>
                  </Field>
                )}

                {triggerKind === "tagContains" && (
                  <Field label={lang === "es" ? "Tag" : "Tag"}>
                    <input
                      value={trigTag}
                      onChange={(e) => setTrigTag(e.target.value)}
                      placeholder={lang === "es" ? "Recurrente" : "Recurring"}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full col-span-2"
                    />
                  </Field>
                )}

                {triggerKind === "priceMin" && (
                  <Field label={lang === "es" ? "Mínimo (€)" : "Minimum (€)"}>
                    <input
                      type="number"
                      min={0}
                      value={trigPriceMin}
                      onChange={(e) => setTrigPriceMin(parseInt(e.target.value) || 0)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full tabular col-span-2"
                    />
                  </Field>
                )}
              </div>

              {triggerKind === "sourceIn" && (
                <Field label={lang === "es" ? "Orígenes (selecciona varios)" : "Sources (multi-select)"}>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCES.map((src) => {
                      const on = trigSources.includes(src);
                      return (
                        <button
                          type="button"
                          key={src}
                          onClick={() =>
                            setTrigSources(on ? trigSources.filter((s) => s !== src) : [...trigSources, src])
                          }
                          className={cn(
                            "px-2 py-1 rounded-md text-[11.5px] border capitalize",
                            on ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border"
                          )}
                        >
                          {src}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            </div>

            <div className="border border-border rounded-lg p-3 bg-bg-2/50 flex flex-col gap-3">
              <div className="text-[10.5px] font-semibold text-accent uppercase tracking-[0.1em]">
                {lang === "es" ? "Qué hace" : "What it does"}
              </div>

              <Field label={lang === "es" ? "Acción" : "Action"}>
                <select
                  value={actionKind}
                  onChange={(e) => setActionKind(e.target.value as ActionKind)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  {(Object.keys(ACTION_LABELS) as ActionKind[]).map((k) => (
                    <option key={k} value={k}>{lang === "es" ? ACTION_LABELS[k].es : ACTION_LABELS[k].en}</option>
                  ))}
                </select>
              </Field>

              {actionKind === "moveStage" && (
                <Field label={lang === "es" ? "Mover a" : "Move to"}>
                  <select
                    value={actMoveStage}
                    onChange={(e) => setActMoveStage(e.target.value as LeadStage)}
                    className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                  >
                    {STAGE_ORDER.map((s) => (
                      <option key={s} value={s}>{lang === "es" ? STAGE_META[s].labelEs : STAGE_META[s].labelEn}</option>
                    ))}
                    <option value="lost">{lang === "es" ? "Perdido" : "Lost"}</option>
                  </select>
                </Field>
              )}

              {actionKind === "createTask" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={lang === "es" ? "Tipo de tarea" : "Task kind"}>
                    <select
                      value={actTaskKind}
                      onChange={(e) => setActTaskKind(e.target.value as TaskKind)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full capitalize"
                    >
                      {TASK_KINDS.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
                    </select>
                  </Field>
                  <Field label={lang === "es" ? "Título tarea" : "Task title"}>
                    <input
                      value={actTaskTitle}
                      onChange={(e) => setActTaskTitle(e.target.value)}
                      placeholder={lang === "es" ? "(usa nombre automatización)" : "(uses automation name)"}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    />
                  </Field>
                </div>
              )}

              {actionKind === "sendEmail" && (
                <Field label={lang === "es" ? "Plantilla email" : "Email template"}>
                  {emailTemplates.length === 0 ? (
                    <div className="text-[12px] text-fg-3">
                      {lang === "es" ? "No hay plantillas de email. Crea una en /plantillas." : "No email templates. Create one in /plantillas."}
                    </div>
                  ) : (
                    <select
                      value={actTemplateId}
                      onChange={(e) => setActTemplateId(e.target.value)}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    >
                      <option value="">{lang === "es" ? "— Email genérico —" : "— Generic email —"}</option>
                      {emailTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title} ({t.stage})</option>
                      ))}
                    </select>
                  )}
                </Field>
              )}

              {actionKind === "setTemp" && (
                <Field label={lang === "es" ? "Temperatura" : "Temperature"}>
                  <select
                    value={actTemp}
                    onChange={(e) => setActTemp(e.target.value)}
                    className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full capitalize"
                  >
                    {TEMPS.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </Field>
              )}

              {(actionKind === "addTag" || actionKind === "removeTag") && (
                <Field label="Tag">
                  <input
                    value={actTag}
                    onChange={(e) => setActTag(e.target.value)}
                    placeholder={lang === "es" ? "Recurrente, VIP, Pendiente…" : "Recurring, VIP, Pending…"}
                    className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                  />
                </Field>
              )}
            </div>

            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-accent" />
              {lang === "es" ? "Activa" : "Enabled"}
            </label>
          </div>

          {confirming ? (
            <div className="m-[18px_22px] border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
              <div className="text-[12.5px] text-fg-1">
                {lang === "es" ? "¿Eliminar esta automatización?" : "Delete this automation?"}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="flex-1 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium">
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button type="button" onClick={onDelete} disabled={del.isPending} className="flex-1 h-9 rounded-md bg-danger text-white text-[12.5px] font-semibold disabled:opacity-60">
                  {lang === "es" ? "Sí, borrar" : "Yes, delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 p-[14px_22px] border-t border-border shrink-0">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="h-10 px-3 rounded-lg border border-border bg-bg-2 text-fg-2 hover:border-danger hover:text-danger"
                  title={lang === "es" ? "Borrar" : "Delete"}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border bg-bg-2 text-[13px] font-medium hover:border-border-strong"
              >
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isPending}
                className="flex-1 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
              >
                {isPending ? (lang === "es" ? "Guardando…" : "Saving…") : (lang === "es" ? "Guardar" : "Save")}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em]">{label}</span>
      {children}
    </label>
  );
}

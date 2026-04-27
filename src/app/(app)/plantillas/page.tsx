"use client";
import { useMemo, useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useTemplates, useUpdateTemplate, useCreateTemplate, useDeleteTemplate } from "@/lib/queries/templates";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Copy, Mail, MessageCircle, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Instagram, Linkedin } from "@/components/icons/BrandIcons";
import { STAGE_ORDER, STAGE_META } from "@/lib/domain";
import type { TemplateChannel } from "@/lib/supabase/types";

const CHANNEL_ICON = {
  whatsapp: MessageCircle,
  email: Mail,
  instagram: Instagram,
  linkedin: Linkedin,
} as const;

const CHANNELS: TemplateChannel[] = ["whatsapp", "email", "instagram", "linkedin"];

export default function PlantillasPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { t, lang } = useT();
  const show = useUI((s) => s.showToast);
  const search = useUI((s) => s.search);
  const update = useUpdateTemplate();
  const create = useCreateTemplate();
  const del = useDeleteTemplate();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", subject: "", channel: "whatsapp" as TemplateChannel, stage: "lead" });
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter((x) => x.title.toLowerCase().includes(q) || x.body.toLowerCase().includes(q));
  }, [templates, search]);

  const active = useMemo(() => filtered.find((x) => x.id === activeId) ?? filtered[0], [filtered, activeId]);

  // Sync form when active changes (and not currently editing)
  useEffect(() => {
    if (!editing && active && !creating) {
      setForm({
        title: active.title,
        body: active.body,
        subject: active.subject ?? "",
        channel: active.channel,
        stage: active.stage,
      });
    }
  }, [active, editing, creating]);

  const copy = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.body);
    show(t("toast_copied") || (lang === "es" ? "Copiado" : "Copied"), "ok");
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(true);
    setForm({ title: "", body: "", subject: "", channel: "whatsapp", stage: "lead" });
    setActiveId(null);
  };

  const startEdit = () => {
    if (!active) return;
    setEditing(true);
    setForm({
      title: active.title,
      body: active.body,
      subject: active.subject ?? "",
      channel: active.channel,
      stage: active.stage,
    });
  };

  const cancelEdit = () => {
    setEditing(false);
    setCreating(false);
    setConfirmDel(false);
  };

  const save = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    if (creating) {
      create.mutate(
        {
          title: form.title.trim(),
          body: form.body,
          subject: form.subject.trim() || null,
          channel: form.channel,
          stage: form.stage,
        },
        {
          onSuccess: (tpl) => {
            show(lang === "es" ? "Plantilla creada" : "Template created", "ok");
            setActiveId(tpl.id);
            setEditing(false);
            setCreating(false);
          },
          onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
        }
      );
    } else if (active) {
      update.mutate(
        {
          id: active.id,
          patch: {
            title: form.title.trim(),
            body: form.body,
            subject: form.subject.trim() || null,
            channel: form.channel,
            stage: form.stage,
          },
        },
        {
          onSuccess: () => {
            show(lang === "es" ? "Plantilla actualizada" : "Template updated", "ok");
            setEditing(false);
          },
          onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
        }
      );
    }
  };

  const onDelete = () => {
    if (!active) return;
    del.mutate(active.id, {
      onSuccess: () => {
        show(lang === "es" ? "Plantilla eliminada" : "Template deleted", "ok");
        setActiveId(null);
        setConfirmDel(false);
      },
      onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
    });
  };

  return (
    <>
      <Topbar title={t("nav_templates")} sub={`${templates.length} ${lang === "es" ? "plantillas" : "templates"} · persuasivas, probadas`} />
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3 md:gap-5 p-3 md:p-6 max-w-[1400px] mx-auto w-full">
        <div className="border border-border rounded-[12px] bg-bg-1 overflow-y-auto flex flex-col">
          <button
            onClick={startCreate}
            className="m-3 inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 shrink-0"
          >
            <Plus size={14} strokeWidth={2} />
            {lang === "es" ? "Nueva plantilla" : "New template"}
          </button>
          <div className="border-t border-border">
            {isLoading && <div className="p-4 text-fg-2 text-sm">Cargando…</div>}
            {filtered.map((tpl) => {
              const Icon = CHANNEL_ICON[tpl.channel] ?? MessageCircle;
              const isActive = active?.id === tpl.id && !creating;
              return (
                <button
                  key={tpl.id}
                  onClick={() => { setActiveId(tpl.id); setEditing(false); setCreating(false); }}
                  className={cn(
                    "w-full text-left p-3 border-b border-border last:border-b-0 hover:bg-bg-2 transition-colors",
                    isActive && "bg-bg-2 border-l-2 border-l-accent pl-[10px]"
                  )}
                >
                  <div className="text-[13px] font-medium mb-1">{tpl.title}</div>
                  <div className="text-[11px] text-fg-2 flex gap-1.5 items-center">
                    <Icon size={11} strokeWidth={1.5} />
                    <span className="capitalize">{tpl.channel}</span>
                    <span className="text-fg-3">·</span>
                    <span>{tpl.stage}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-border rounded-[12px] bg-bg-1 flex flex-col overflow-hidden">
          {!active && !creating && (
            <div className="flex-1 grid place-items-center text-fg-2 text-sm">
              {lang === "es" ? "Selecciona o crea una plantilla" : "Select or create a template"}
            </div>
          )}

          {(active || creating) && !editing && active && (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{active.title}</div>
                  <div className="text-[11px] text-fg-2 mt-0.5 capitalize">{active.channel} · {active.stage}</div>
                </div>
                <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-ink font-semibold text-[12px]">
                  <Copy size={13} strokeWidth={1.8} />
                  {t("tpl_copy") || (lang === "es" ? "Copiar" : "Copy")}
                </button>
                <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-2 border border-border text-[12px] hover:border-border-strong">
                  <Pencil size={12} strokeWidth={1.8} />
                  {lang === "es" ? "Editar" : "Edit"}
                </button>
              </div>
              <div className="px-5 sm:px-7 py-6 overflow-y-auto flex-1">
                {active.subject && (
                  <div className="text-[15px] font-semibold pb-3 mb-3.5 border-b border-border">{renderPlaceholders(active.subject)}</div>
                )}
                <pre className="m-0 whitespace-pre-wrap font-sans text-[13.5px] leading-[1.7] text-fg-1">{renderPlaceholders(active.body)}</pre>
              </div>
            </>
          )}

          {(editing || creating) && (
            <>
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                <h3 className="m-0 text-[14px] font-semibold flex-1">
                  {creating ? (lang === "es" ? "Nueva plantilla" : "New template") : (lang === "es" ? "Editar plantilla" : "Edit template")}
                </h3>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-2 border border-border text-[12px] hover:border-border-strong"
                >
                  <X size={12} strokeWidth={1.8} />
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  onClick={save}
                  disabled={!form.title.trim() || !form.body.trim() || update.isPending || create.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-ink font-semibold text-[12px] hover:brightness-105 disabled:opacity-60"
                >
                  <Check size={13} strokeWidth={2.2} />
                  {lang === "es" ? "Guardar" : "Save"}
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-3.5">
                <Field label={lang === "es" ? "Título" : "Title"}>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={lang === "es" ? "Canal" : "Channel"}>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as TemplateChannel }))}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full capitalize"
                    >
                      {CHANNELS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </Field>
                  <Field label={lang === "es" ? "Etapa" : "Stage"}>
                    <select
                      value={form.stage}
                      onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>{lang === "es" ? STAGE_META[s].labelEs : STAGE_META[s].labelEn}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {form.channel === "email" && (
                  <Field label={lang === "es" ? "Asunto" : "Subject"}>
                    <input
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder={lang === "es" ? "Sobre tu web…" : "About your site…"}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    />
                  </Field>
                )}
                <Field label={lang === "es" ? "Cuerpo (usa {{variables}})" : "Body (use {{variables}})"}>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    rows={10}
                    className="rounded-lg bg-bg-2 border border-border px-3 py-2 text-[13.5px] outline-none focus:border-accent w-full font-sans leading-[1.6] resize-y"
                  />
                </Field>

                {!creating && active && (
                  <div className="mt-4">
                    {confirmDel ? (
                      <div className="border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
                        <div className="text-[12.5px] text-fg-1">
                          {lang === "es" ? "¿Eliminar esta plantilla?" : "Delete this template?"}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDel(false)} className="flex-1 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium">
                            {lang === "es" ? "Cancelar" : "Cancel"}
                          </button>
                          <button onClick={onDelete} disabled={del.isPending} className="flex-1 h-9 rounded-md bg-danger text-white text-[12.5px] font-semibold disabled:opacity-60">
                            {lang === "es" ? "Sí, borrar" : "Yes, delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDel(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-2 border border-border text-[12px] text-fg-2 hover:border-danger hover:text-danger"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                        {lang === "es" ? "Borrar plantilla" : "Delete template"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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

function renderPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((p, i) =>
    p.match(/^\{\{(\w+)\}\}$/) ? (
      <span key={i} className="bg-accent-soft text-accent rounded px-1.5 py-0.5 font-mono text-[12px]">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

"use client";
import { useEffect, useState } from "react";
import { X, Mail, Phone, Globe, MapPin, Tag, Trash2, Plus, Check, Send, MessageCircle } from "lucide-react";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/useT";
import { useDeal, useUpdateDeal, useDeleteDeal } from "@/lib/queries/deals";
import { useTimeline } from "@/lib/queries/timeline";
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from "@/lib/queries/tasks";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { SendEmailDialog } from "@/components/email/SendEmailDialog";
import { SendWhatsAppDialog } from "@/components/whatsapp/SendWhatsAppDialog";
import type { Task } from "@/lib/supabase/types";
import { STAGE_ORDER, STAGE_META, TEMP_META, SOURCE_META, PROJECT_META, PAIN_META, probabilityFor, dealValue } from "@/lib/domain";
import { fmtEuro, avatarGradient, daysBetween, mailtoLink, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Composer } from "./Composer";
import { TimelineList } from "./TimelineList";

const TABS = ["summary", "conversation", "problems", "notes"] as const;
type Tab = typeof TABS[number];

export function LeadDrawer() {
  const id = useUI((s) => s.selectedDealId);
  const close = useUI((s) => s.closeDeal);
  const { t, lang } = useT();
  const { data: deal } = useDeal(id);
  const [tab, setTab] = useState<Tab>("summary");
  const [emailOpen, setEmailOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const show = useUI((s) => s.showToast);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (id) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, close]);

  if (!id) return null;

  if (!deal) {
    return (
      <>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 backdrop-enter" onClick={close} />
        <aside className="fixed top-0 right-0 bottom-0 w-[900px] max-w-[92vw] bg-bg-1 border-l border-border z-50 drawer-enter">
          <div className="h-full grid place-items-center text-fg-2 text-sm">Cargando…</div>
        </aside>
      </>
    );
  }

  const prob = probabilityFor(deal);
  const value = dealValue(deal);
  const daysInStage = daysBetween(deal.stage_entered_at, new Date());

  const moveStage = (stage: typeof STAGE_ORDER[number]) => {
    if (stage === deal.stage) return;
    updateDeal.mutate(
      { id: deal.id, patch: { stage, stage_entered_at: new Date().toISOString() } },
      { onSuccess: () => show(lang === "es" ? `Movido a ${STAGE_META[stage].labelEs}` : `Moved to ${STAGE_META[stage].labelEn}`, "ok") }
    );
  };

  const onDelete = () => {
    if (!confirm(lang === "es" ? "¿Eliminar este lead?" : "Delete this lead?")) return;
    deleteDeal.mutate(deal.id, {
      onSuccess: () => {
        show(lang === "es" ? "Lead eliminado" : "Lead deleted", "ok");
        close();
      },
      onError: (e) => show(e instanceof Error ? e.message : "Error", "error"),
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 backdrop-enter" onClick={close} />
      <aside className="fixed top-0 right-0 bottom-0 w-[900px] max-w-[92vw] bg-bg-1 border-l border-border z-50 drawer-enter flex flex-col">
        {/* HEAD */}
        <div className="p-[18px_24px] border-b border-border flex items-start gap-[14px]">
          <div
            className="w-[52px] h-[52px] rounded-xl grid place-items-center text-[16px] font-semibold text-white"
            style={{ background: avatarGradient(deal.id) }}
          >
            {deal.contact?.avatar || deal.code.slice(-2)}
          </div>
          <div className="flex-1 min-w-0">
            <EditableTitle
              value={deal.title}
              displayValue={deal.company?.name ?? deal.title}
              onSave={(v) => updateDeal.mutate({ id: deal.id, patch: { title: v } })}
            />
            <div className="flex gap-2.5 mt-1 text-[12px] text-fg-2 items-center flex-wrap">
              <span>{deal.contact?.name ?? "—"}</span>
              {deal.contact?.role && <><span className="text-fg-3">·</span><span>{deal.contact.role}</span></>}
              {deal.company?.city && <><span className="text-fg-3">·</span><span>{deal.company.city}</span></>}
              <span className="text-fg-3">·</span>
              <span className="mono text-fg-3">{deal.code}</span>
            </div>
          </div>
          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={() => setWaOpen(true)}
              className="w-9 h-9 grid place-items-center rounded-lg bg-bg-2 border border-border hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              title={lang === "es" ? "Enviar WhatsApp" : "Send WhatsApp"}
              disabled={!deal.contact?.phone}
            >
              <MessageCircle size={15} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setEmailOpen(true)}
              className="w-9 h-9 grid place-items-center rounded-lg bg-bg-2 border border-border hover:border-accent hover:text-accent transition-colors"
              title={lang === "es" ? "Enviar email" : "Send email"}
              disabled={!deal.contact?.email}
            >
              <Send size={15} strokeWidth={1.5} />
            </button>
            <button
              onClick={onDelete}
              className="w-9 h-9 grid place-items-center rounded-lg bg-bg-2 border border-border hover:border-danger hover:text-danger transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
            <button
              onClick={close}
              className="w-9 h-9 grid place-items-center rounded-lg bg-bg-2 border border-border hover:border-border-strong text-fg-1"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* STAGE BAR */}
        <div className="flex border-b border-border px-6 py-2.5 gap-1.5 overflow-x-auto">
          {STAGE_ORDER.map((s, i) => {
            const currentIdx = STAGE_ORDER.indexOf(deal.stage);
            const isCurrent = s === deal.stage;
            const isDone = i < currentIdx;
            return (
              <button
                key={s}
                onClick={() => moveStage(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11.5px] font-medium whitespace-nowrap transition-colors",
                  isCurrent && "bg-accent text-accent-ink",
                  isDone && !isCurrent && "bg-bg-3 text-fg-1",
                  !isCurrent && !isDone && "bg-bg-2 text-fg-2 hover:text-fg-0 border border-border"
                )}
              >
                {lang === "es" ? STAGE_META[s].labelEs : STAGE_META[s].labelEn}
              </button>
            );
          })}
        </div>

        {/* TABS */}
        <div className="flex gap-0.5 px-6 border-b border-border bg-bg-1">
          {TABS.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={cn(
                "px-3.5 py-2.5 text-[12.5px] border-b-2 font-medium inline-flex items-center gap-1.5",
                tab === x ? "text-fg-0 border-accent" : "text-fg-2 border-transparent hover:text-fg-0"
              )}
            >
              {x === "summary" && t("tab_summary")}
              {x === "conversation" && t("tab_conversation")}
              {x === "problems" && t("tab_problems")}
              {x === "notes" && t("tab_notes")}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {tab === "summary" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <Panel title={lang === "es" ? "Información" : "Information"}>
                  <KV label={t("f_contact")}    value={deal.contact?.name ?? "—"} />
                  <KV label={t("f_role")}       value={deal.contact?.role ?? "—"} />
                  <KV label={t("f_city")}       value={deal.company?.city ?? "—"} icon={<MapPin size={12} strokeWidth={1.5} />} />
                  <KV label={t("f_sector")}     value={deal.company?.sector ?? "—"} />
                  <KV label={t("f_web")}        value={deal.company?.website || "—"} icon={<Globe size={12} strokeWidth={1.5} />} mono />
                  <KV label={t("f_email")}      value={deal.contact?.email || "—"} icon={<Mail size={12} strokeWidth={1.5} />} mono
                      href={deal.contact?.email ? mailtoLink(deal.contact.email) : undefined} />
                  <KV label={t("f_phone")}      value={deal.contact?.phone || "—"} icon={<Phone size={12} strokeWidth={1.5} />} mono
                      href={deal.contact?.phone ? whatsappLink(deal.contact.phone) : undefined} />
                </Panel>

                <Panel title={lang === "es" ? "Economía" : "Economics"}>
                  <EditableNumberKV label={t("f_budget")}  value={deal.price_estimated} onSave={(v) => updateDeal.mutate({ id: deal.id, patch: { price_estimated: v } })} />
                  <EditableNumberKV label={t("f_offered")} value={deal.price_offered ?? 0} onSave={(v) => updateDeal.mutate({ id: deal.id, patch: { price_offered: v } })} />
                  <EditableNumberKV label={t("f_closed")}  value={deal.price_closed ?? 0} onSave={(v) => updateDeal.mutate({ id: deal.id, patch: { price_closed: v } })} />
                  <EditableNumberKV label={t("f_cost")}    value={deal.cost_estimated} onSave={(v) => updateDeal.mutate({ id: deal.id, patch: { cost_estimated: v } })} />
                  <KV label={t("f_margin")}  value={fmtEuro(value - deal.cost_estimated, lang)} mono />
                  <KV label={t("f_pay_state")} value={deal.pay_state} />
                </Panel>

                <TasksPanel dealId={deal.id} />
              </div>

              <div className="flex flex-col gap-4">
                <Panel>
                  <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">{t("f_score")}</div>
                  <ScoreRing score={deal.score} />
                  <div className="mt-3 text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-1.5">
                    {t("f_probability")}
                  </div>
                  <div className="text-[15px] font-semibold text-accent tabular">{Math.round(prob * 100)}%</div>
                  <div className="mt-3 text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-1.5">
                    {t("f_temperature")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("dot", TEMP_META[deal.temp].className)} />
                    <span className="text-[13px]">{lang === "es" ? TEMP_META[deal.temp].labelEs : TEMP_META[deal.temp].labelEn}</span>
                  </div>
                  <div className="mt-3 text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-1.5">
                    {lang === "es" ? "En etapa desde" : "In stage since"}
                  </div>
                  <div className="text-[13px] tabular">{daysInStage}d</div>
                </Panel>

                <Panel title={t("f_source")}>
                  <div className="text-[13px]">
                    <span className="mr-2">{SOURCE_META[deal.source].icon}</span>
                    {lang === "es" ? SOURCE_META[deal.source].labelEs : SOURCE_META[deal.source].labelEn}
                  </div>
                  <div className="text-[12px] text-fg-2 mt-3 mb-1">{t("f_project_type")}</div>
                  <div className="text-[13px]">{lang === "es" ? PROJECT_META[deal.project_type].labelEs : PROJECT_META[deal.project_type].labelEn}</div>
                  <div className="text-[12px] text-fg-2 mt-3 mb-1">{t("f_pain")}</div>
                  <div className="text-[13px]">{lang === "es" ? PAIN_META[deal.pain].labelEs : PAIN_META[deal.pain].labelEn}</div>
                  <div className="text-[12px] text-fg-2 mt-3 mb-1.5">{lang === "es" ? "Tags" : "Tags"}</div>
                  <EditableTags
                    tags={deal.tags}
                    onSave={(tags) => updateDeal.mutate({ id: deal.id, patch: { tags } })}
                  />
                </Panel>

                {deal.next_action && (
                  <Panel title={t("f_next_action")}>
                    <div className="text-[13px] font-medium">{deal.next_action}</div>
                    <div className="text-[11px] text-fg-2 mono mt-1">{deal.next_action_date}</div>
                  </Panel>
                )}
              </div>
            </div>
          )}

          {tab === "conversation" && (
            <ConversationTab
              dealId={deal.id}
              deal={deal}
              onOpenEmail={() => setEmailOpen(true)}
              onOpenWhatsApp={() => setWaOpen(true)}
            />
          )}

          {tab === "problems" && (
            <div className="p-6">
              <Panel title={t("f_problems")}>
                <EditableList
                  items={deal.problems}
                  placeholder={lang === "es" ? "Añadir problema detectado…" : "Add detected issue…"}
                  emptyText={lang === "es" ? "Sin problemas detectados todavía." : "No issues detected yet."}
                  onSave={(items) => updateDeal.mutate({ id: deal.id, patch: { problems: items } })}
                />
              </Panel>
            </div>
          )}

          {tab === "notes" && (
            <div className="p-6">
              <Panel title={t("f_notes")}>
                <textarea
                  defaultValue={deal.notes}
                  onBlur={(e) => {
                    if (e.target.value !== deal.notes) {
                      updateDeal.mutate({ id: deal.id, patch: { notes: e.target.value } });
                    }
                  }}
                  className="w-full min-h-[160px] bg-bg-2 border border-border rounded-lg p-3 text-[13px] text-fg-0 outline-none focus:border-accent resize-y"
                />
              </Panel>
            </div>
          )}
        </div>
      </aside>
      <SendEmailDialog deal={emailOpen ? deal : null} onClose={() => setEmailOpen(false)} />
      <SendWhatsAppDialog deal={waOpen ? deal : null} onClose={() => setWaOpen(false)} />
    </>
  );
}

function ConversationTab({
  dealId,
  deal,
  onOpenEmail,
  onOpenWhatsApp,
}: {
  dealId: string;
  deal: { contact?: { email?: string | null; phone?: string | null; name?: string } | null; company?: { name?: string } | null };
  onOpenEmail: () => void;
  onOpenWhatsApp: () => void;
}) {
  const { data: events = [], isLoading } = useTimeline(dealId);
  const { lang } = useT();

  const hasEmail = !!deal.contact?.email;
  const hasPhone = !!deal.contact?.phone;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {/* Quick send actions — open the real dialogs that send via Gmail SMTP / WhatsApp Web */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onOpenEmail}
          disabled={!hasEmail}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-2 hover:border-accent hover:bg-bg-3 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent grid place-items-center group-hover:bg-accent group-hover:text-accent-ink transition-colors">
            <Send size={18} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold">{lang === "es" ? "Enviar email" : "Send email"}</div>
            <div className="text-[11.5px] text-fg-2 truncate">
              {hasEmail
                ? deal.contact?.email
                : lang === "es" ? "Sin email — añade uno en Información" : "No email — add one in Info"}
            </div>
          </div>
        </button>
        <button
          onClick={onOpenWhatsApp}
          disabled={!hasPhone}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-2 hover:border-[#25D366] hover:bg-bg-3 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 text-[#25D366] grid place-items-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
            <MessageCircle size={18} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold">{lang === "es" ? "Enviar WhatsApp" : "Send WhatsApp"}</div>
            <div className="text-[11.5px] text-fg-2 truncate">
              {hasPhone
                ? deal.contact?.phone
                : lang === "es" ? "Sin teléfono — añade uno en Información" : "No phone — add one in Info"}
            </div>
          </div>
        </button>
      </div>

      {/* Manual log composer (records without sending — useful for documenting calls / in-person meetings) */}
      <div>
        <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
          {lang === "es" ? "Anotar interacción manual" : "Log manual interaction"}
        </div>
        <Composer dealId={dealId} contactEmail={deal.contact?.email ?? null} contactPhone={deal.contact?.phone ?? null} />
      </div>

      <div>
        <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-3">
          {lang === "es" ? "Historial" : "History"}
        </div>
        {isLoading && <div className="text-fg-2 text-sm">Cargando…</div>}
        <TimelineList events={events} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-2 border border-border rounded-xl p-4">
      {title && <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2.5">{title}</div>}
      {children}
    </div>
  );
}

function KV({ label, value, icon, mono = false, href }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean; href?: string }) {
  return (
    <div className="flex items-center py-1 border-b border-border last:border-b-0 text-[13px]">
      <span className="text-fg-2 w-[130px] shrink-0 flex items-center gap-1.5">{icon}{label}</span>
      {href ? (
        <a className={cn("text-fg-0 hover:text-accent truncate", mono && "mono text-[12px]")} href={href} target="_blank" rel="noopener noreferrer">{value}</a>
      ) : (
        <span className={cn("text-fg-0 truncate", mono && "mono text-[12px]")}>{value}</span>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const R = 18;
  const C = 2 * Math.PI * R;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  return (
    <div className="relative w-[52px] h-[52px]">
      <svg className="rotate-[-90deg]" viewBox="0 0 48 48" width={52} height={52}>
        <circle cx={24} cy={24} r={R} fill="none" stroke="var(--bg-3)" strokeWidth={4} />
        <circle
          cx={24} cy={24} r={R} fill="none"
          stroke="var(--accent)"
          strokeWidth={4}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[14px] font-bold tabular">{score}</div>
    </div>
  );
}

function EditableTitle({ value, displayValue, onSave }: { value: string; displayValue: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() && draft !== value) onSave(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full text-[20px] font-semibold -tracking-[0.01em] bg-bg-2 border border-accent rounded px-2 py-0.5 outline-none"
      />
    );
  }
  return (
    <h2
      onClick={() => setEditing(true)}
      className="m-0 text-[20px] font-semibold -tracking-[0.01em] truncate cursor-text hover:text-accent transition-colors"
      title="Click para editar"
    >
      {displayValue}
    </h2>
  );
}

function EditableNumberKV({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const { lang } = useT();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  return (
    <div className="flex items-center py-1 border-b border-border last:border-b-0 text-[13px]">
      <span className="text-fg-2 w-[130px] shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-1.5">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = parseInt(draft) || 0;
            if (n !== value) onSave(n);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className="bg-transparent border-0 outline-none mono text-[12px] text-fg-0 w-full hover:bg-bg-3 focus:bg-bg-3 rounded px-1.5 py-0.5 transition-colors"
          min={0}
        />
        <span className="text-fg-3 text-[11px] mono shrink-0">€</span>
        <span className="text-fg-3 text-[10px] shrink-0 hidden sm:inline">{lang === "es" ? "click" : "click"}</span>
      </div>
    </div>
  );
}

function EditableTags({ tags, onSave }: { tags: string[]; onSave: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const { lang } = useT();

  const add = () => {
    const v = draft.trim();
    if (!v || tags.includes(v)) { setDraft(""); return; }
    onSave([...tags, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="text-[11px] bg-bg-3 border border-border rounded-md pl-2 pr-1 py-0.5 inline-flex items-center gap-1 group">
          <Tag size={10} strokeWidth={1.5} />
          {tag}
          <button
            type="button"
            onClick={() => onSave(tags.filter((x) => x !== tag))}
            className="text-fg-3 hover:text-danger ml-0.5"
            aria-label="remove tag"
          >
            <X size={11} strokeWidth={1.5} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !draft && tags.length) onSave(tags.slice(0, -1));
        }}
        onBlur={add}
        placeholder={lang === "es" ? "+ tag" : "+ tag"}
        className="text-[11px] bg-transparent border border-dashed border-border rounded-md px-2 py-0.5 outline-none focus:border-accent w-[80px]"
      />
    </div>
  );
}

function EditableList({ items, placeholder, emptyText, onSave }: { items: string[]; placeholder: string; emptyText: string; onSave: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onSave([...items, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <div className="text-fg-2 text-[13px]">{emptyText}</div>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((p, i) => (
            <li key={i} className="text-[13px] text-fg-1 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-accent flex justify-between gap-2 group">
              <span className="flex-1">{p}</span>
              <button
                type="button"
                onClick={() => onSave(items.filter((_, j) => j !== i))}
                className="text-fg-3 hover:text-danger opacity-0 group-hover:opacity-100"
                aria-label="remove"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 h-9 bg-bg-3 border border-border rounded-md px-3 text-[13px] outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-3 h-9 rounded-md bg-accent text-accent-ink font-semibold text-[12px] disabled:opacity-60"
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function TasksPanel({ dealId }: { dealId: string }) {
  const { data: allTasks = [] } = useTasks();
  const tasks = allTasks.filter((task) => task.deal?.id === dealId);
  const create = useCreateTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const { lang } = useT();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);

  const add = () => {
    if (!title.trim()) return;
    create.mutate({ title: title.trim(), dealId, due: lang === "es" ? "Hoy" : "Today" });
    setTitle("");
  };

  return (
    <div className="bg-bg-2 border border-border rounded-xl p-4">
      <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2.5">
        {lang === "es" ? "Tareas" : "Tasks"}
      </div>

      {tasks.length === 0 && (
        <div className="text-fg-3 text-[12px] mb-2">{lang === "es" ? "Sin tareas para este lead." : "No tasks for this lead."}</div>
      )}

      <ul className="list-none p-0 m-0 flex flex-col gap-1.5 mb-3">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 text-[13px] group">
            <button
              type="button"
              onClick={() => toggle.mutate({ id: task.id, done: !task.done })}
              className={cn(
                "w-[16px] h-[16px] rounded-[4px] border-[1.5px] border-border-strong grid place-items-center shrink-0 hover:border-accent",
                task.done && "bg-accent border-accent"
              )}
            >
              {task.done && <Check size={10} strokeWidth={3} className="text-accent-ink" />}
            </button>
            <span
              onClick={() => setEditing(task)}
              className={cn("flex-1 truncate cursor-pointer hover:text-accent", task.done && "line-through text-fg-3 hover:text-fg-3")}
            >
              {task.title}
            </span>
            <span className="text-[10.5px] text-fg-3 mono shrink-0">{task.due}</span>
            <button
              type="button"
              onClick={() => del.mutate(task.id)}
              className="text-fg-3 hover:text-danger md:opacity-0 md:group-hover:opacity-100"
              aria-label="delete task"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={lang === "es" ? "Nueva tarea para este lead…" : "New task for this lead…"}
          className="flex-1 h-9 bg-bg-3 border border-border rounded-md px-3 text-[13px] outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim() || create.isPending}
          className="px-3 h-9 rounded-md bg-accent text-accent-ink font-semibold text-[12px] disabled:opacity-60"
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>
      <EditTaskDialog task={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

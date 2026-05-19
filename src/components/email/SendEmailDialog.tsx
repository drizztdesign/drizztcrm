"use client";
import { useEffect, useState, useMemo } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { useTemplates } from "@/lib/queries/templates";
import { useUpdateDealStage } from "@/lib/queries/deals";
import { PROSPECTING_STAGES } from "@/lib/domain";
import type { DealWithRelations } from "@/lib/supabase/types";

export function SendEmailDialog({
  deal,
  onClose,
}: {
  deal: DealWithRelations | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const { data: templates = [] } = useTemplates();
  const updateStage = useUpdateDealStage();

  const emailTemplates = useMemo(() => templates.filter((t) => t.channel === "email"), [templates]);

  const [templateId, setTemplateId] = useState<string>("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (deal) {
      setTo(deal.contact?.email ?? "");
      setTemplateId("");
      setSubject("");
      setBody("");
    }
  }, [deal]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) { setSubject(""); setBody(""); return; }
    const t = emailTemplates.find((x) => x.id === id);
    if (!t) return;
    const vars: Record<string, string> = {
      contacto: deal?.contact?.name || deal?.company?.name || "",
      empresa: deal?.company?.name ?? "",
      web: deal?.company?.website ?? "",
      sector: deal?.company?.sector ?? "",
      ciudad: deal?.company?.city ?? "",
      presupuesto: String(deal?.price_estimated ?? ""),
      telefono: deal?.contact?.phone ?? "",
    };
    const fill = (s: string) =>
      s.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k.toLowerCase()] ?? vars[k] ?? "");
    setSubject(fill(t.subject ?? ""));
    setBody(fill(t.body));
  };

  if (!deal) return null;

  const send = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body,
          dealId: deal.id,
          contactId: deal.contact?.id ?? null,
          templateId: templateId || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      // Advance stage to "contactado" if still in early stage
      if (deal && (deal.stage === "lead" || PROSPECTING_STAGES.includes(deal.stage))) {
        updateStage.mutate({ id: deal.id, stage: "contactado" });
      }
      show(lang === "es" ? "Email enviado" : "Email sent", "ok");
      onClose();
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[55] backdrop-enter" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[92vw] max-h-[90vh] bg-bg-1 border border-border rounded-2xl z-[56] drawer-enter shadow-pop flex flex-col">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border shrink-0">
          <h2 className="m-0 text-[16px] font-semibold">
            {lang === "es" ? "Enviar email" : "Send email"}
          </h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto p-[18px_22px] flex flex-col gap-3.5 flex-1">
          {emailTemplates.length > 0 && (
            <Field label={lang === "es" ? "Plantilla" : "Template"}>
              <select
                value={templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                <option value="">{lang === "es" ? "— En blanco —" : "— Blank —"}</option>
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label={lang === "es" ? "Para" : "To"}>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="cliente@empresa.com"
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
            />
          </Field>
          <Field label={lang === "es" ? "Asunto" : "Subject"}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={lang === "es" ? "Tu propuesta…" : "Your proposal…"}
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
            />
          </Field>
          <Field label={lang === "es" ? "Mensaje" : "Body"}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder={lang === "es" ? "Escribe tu mensaje…" : "Type your message…"}
              className="rounded-lg bg-bg-2 border border-border px-3 py-2 text-[13.5px] outline-none focus:border-accent w-full resize-y leading-[1.6]"
            />
          </Field>
          <p className="text-[10.5px] text-fg-3 leading-relaxed">
            {lang === "es"
              ? "Se envía desde tu Gmail (configurado en variables de entorno). Se añade un código de referencia al asunto para detectar respuestas y volcarlas en este lead automáticamente."
              : "Sent from your configured Gmail. A reference code is appended to the subject so replies are auto-attached to this lead."}
          </p>
        </div>
        <div className="flex gap-2 p-[14px_22px] border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border bg-bg-2 text-[13px] font-medium hover:border-border-strong"
          >
            {lang === "es" ? "Cancelar" : "Cancel"}
          </button>
          <button
            onClick={send}
            disabled={!to.trim() || !subject.trim() || !body.trim() || sending}
            className="flex-1 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={1.8} />}
            {sending ? (lang === "es" ? "Enviando…" : "Sending…") : (lang === "es" ? "Enviar" : "Send")}
          </button>
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

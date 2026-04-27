"use client";
import { useEffect, useState, useMemo } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { useTemplates } from "@/lib/queries/templates";
import { useAddTimelineEvent } from "@/lib/queries/timeline";
import { whatsappLink } from "@/lib/format";
import type { DealWithRelations } from "@/lib/supabase/types";

export function SendWhatsAppDialog({
  deal,
  onClose,
}: {
  deal: DealWithRelations | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const { data: templates = [] } = useTemplates();
  const addTimeline = useAddTimelineEvent();

  const waTemplates = useMemo(() => templates.filter((t) => t.channel === "whatsapp"), [templates]);

  const [templateId, setTemplateId] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (deal) {
      setPhone(deal.contact?.phone ?? "");
      setTemplateId("");
      setText("");
    }
  }, [deal]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) { setText(""); return; }
    const t = waTemplates.find((x) => x.id === id);
    if (!t) return;
    const vars: Record<string, string> = {
      contacto: deal?.contact?.name ?? "",
      empresa: deal?.company?.name ?? "",
      web: deal?.company?.website ?? "",
      sector: deal?.company?.sector ?? "",
      ciudad: deal?.company?.city ?? "",
      presupuesto: String(deal?.price_estimated ?? ""),
      telefono: deal?.contact?.phone ?? "",
    };
    const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? `{{${k}}}`);
    setText(fill(t.body));
  };

  if (!deal) return null;

  const openWhatsApp = () => {
    if (!phone.trim() || !text.trim()) return;
    const url = whatsappLink(phone.trim(), text);
    window.open(url, "_blank", "noopener,noreferrer");

    // Log to timeline so the conversation history is in the CRM
    addTimeline.mutate(
      {
        dealId: deal.id,
        kind: "whatsapp",
        who: lang === "es" ? "Tú" : "You",
        body: text,
        t: lang === "es" ? "Ahora (WhatsApp)" : "Just now (WhatsApp)",
      },
      {
        onSuccess: () => {
          show(lang === "es" ? "WhatsApp abierto, revisa y pulsa enviar" : "WhatsApp opened, review and send", "ok");
          onClose();
        },
        onError: (e) => show(e instanceof Error ? e.message : "Error", "error"),
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[55] backdrop-enter" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[92vw] max-h-[90vh] bg-bg-1 border border-border rounded-2xl z-[56] drawer-enter shadow-pop flex flex-col">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border shrink-0">
          <h2 className="m-0 text-[16px] font-semibold flex items-center gap-2">
            <MessageCircle size={16} className="text-[#25D366]" strokeWidth={1.8} />
            WhatsApp
          </h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto p-[18px_22px] flex flex-col gap-3.5 flex-1">
          {waTemplates.length > 0 && (
            <Field label={lang === "es" ? "Plantilla" : "Template"}>
              <select
                value={templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                <option value="">{lang === "es" ? "— En blanco —" : "— Blank —"}</option>
                {waTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label={lang === "es" ? "Teléfono" : "Phone"}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
            />
          </Field>
          <Field label={lang === "es" ? "Mensaje" : "Message"}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={lang === "es" ? "Escribe tu mensaje…" : "Type your message…"}
              className="rounded-lg bg-bg-2 border border-border px-3 py-2 text-[13.5px] outline-none focus:border-accent w-full resize-y leading-[1.6]"
            />
          </Field>
          <p className="text-[10.5px] text-fg-3 leading-relaxed">
            {lang === "es"
              ? "Al enviar se abre WhatsApp Web con el mensaje listo. Confirmas el envío con un click. Se añade al timeline aunque no envíes finalmente — borra a mano si no enviaste."
              : "Opens WhatsApp Web with the message ready. Confirm with one click. Logged to timeline even if not sent — delete manually if you didn't send."}
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
            onClick={openWhatsApp}
            disabled={!phone.trim() || !text.trim()}
            className="flex-1 h-10 rounded-lg bg-[#25D366] text-white font-semibold text-[13px] hover:brightness-105 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
          >
            <Send size={14} strokeWidth={1.8} />
            {lang === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}
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

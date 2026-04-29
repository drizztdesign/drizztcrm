"use client";
import { useState, useMemo } from "react";
import { X, Send, Globe, MessageCircle, CheckCircle, Loader2 } from "lucide-react";
import type { DealWithRelations, LeadStage } from "@/lib/supabase/types";
import { useTemplates } from "@/lib/queries/templates";
import { useUpdateDealStage } from "@/lib/queries/deals";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";

interface Props {
  stage: LeadStage;
  items: DealWithRelations[];
  onClose: () => void;
}

function fillTemplate(body: string, deal: DealWithRelations): string {
  return body
    .replace(/\{\{empresa\}\}/gi, deal.company?.name ?? deal.title)
    .replace(/\{\{nombre\}\}/gi, deal.contact?.name ?? deal.company?.name ?? deal.title)
    .replace(/\{\{ciudad\}\}/gi, deal.company?.city ?? "")
    .replace(/\{\{web\}\}/gi, deal.company?.website ?? "")
    .replace(/\{\{telefono\}\}/gi, deal.contact?.phone ?? deal.company?.phone ?? "");
}

export function BulkProspectDialog({ stage, items, onClose }: Props) {
  const { t, lang } = useT();
  const { data: templates = [] } = useTemplates();
  const updateStage = useUpdateDealStage();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<Record<string, "pending" | "ok" | "err">>({});
  const [done, setDone] = useState(false);

  const isEmail = stage === "prospecto_email";
  const isWeb = stage === "prospecto_web";
  const isWa = stage === "prospecto_frio";

  const emailTemplates = useMemo(
    () => templates.filter((t) => t.channel === "email"),
    [templates]
  );
  const waTemplates = useMemo(
    () => templates.filter((t) => t.channel === "whatsapp"),
    [templates]
  );

  const selectedTemplate = (isEmail ? emailTemplates : waTemplates).find(
    (t) => t.id === selectedTemplateId
  );

  // Leads with actionable data
  const actionable = useMemo(() => {
    if (isEmail) return items.filter((d) => d.contact?.email);
    if (isWeb) return items.filter((d) => d.company?.website);
    if (isWa) return items.filter((d) => d.contact?.phone ?? d.company?.phone);
    return items;
  }, [items, isEmail, isWeb, isWa]);

  const title = isEmail
    ? (lang === "es" ? "Enviar email en masa" : "Bulk email")
    : isWeb
    ? (lang === "es" ? "Abrir webs" : "Open websites")
    : (lang === "es" ? "Enviar WhatsApp en masa" : "Bulk WhatsApp");

  const handleOpenWebs = () => {
    actionable.forEach((d) => {
      window.open(d.company!.website, "_blank", "noopener,noreferrer");
    });
    onClose();
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    const initial: Record<string, "pending"> = {};
    actionable.forEach((d) => { initial[d.id] = "pending"; });
    setProgress(initial);

    for (const deal of actionable) {
      const email = deal.contact?.email ?? "";
      const subject = fillTemplate(selectedTemplate.subject ?? selectedTemplate.title, deal);
      const body = fillTemplate(selectedTemplate.body, deal);
      try {
        const r = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: deal.id, to: email, subject, body }),
        });
        if (!r.ok) throw new Error();
        setProgress((p) => ({ ...p, [deal.id]: "ok" }));
        updateStage.mutate({ id: deal.id, stage: "contactado" });
      } catch {
        setProgress((p) => ({ ...p, [deal.id]: "err" }));
      }
    }
    setSending(false);
    setDone(true);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedTemplate) return;
    actionable.forEach((d) => {
      const phone = (d.contact?.phone ?? d.company?.phone ?? "").replace(/\D/g, "");
      if (!phone) return;
      const text = encodeURIComponent(fillTemplate(selectedTemplate.body, d));
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
    });
    actionable.forEach((d) => {
      updateStage.mutate({ id: d.id, stage: "contactado" });
    });
    onClose();
  };

  const noData = actionable.length === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[95vw] bg-bg-1 border border-border rounded-2xl z-50 shadow-pop flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold m-0">{title}</h2>
            <p className="text-[12px] text-fg-2 mt-0.5">
              {actionable.length} {lang === "es" ? "leads listos" : "leads ready"}
              {items.length !== actionable.length && ` · ${items.length - actionable.length} ${lang === "es" ? "sin datos" : "no data"}`}
            </p>
          </div>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* No data warning */}
          {noData && (
            <div className="text-center py-8 text-fg-2 text-[13px]">
              {lang === "es"
                ? `Ningún lead en esta columna tiene ${isEmail ? "email" : isWeb ? "web" : "teléfono"} registrado.`
                : `No leads in this column have a ${isEmail ? "email" : isWeb ? "website" : "phone"} on record.`}
            </div>
          )}

          {/* Open webs action */}
          {isWeb && !noData && (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-fg-1 leading-relaxed">
                {lang === "es"
                  ? `Se abrirán ${actionable.length} pestañas con las webs de los negocios para que puedas buscar el email de contacto manualmente.`
                  : `${actionable.length} tabs will open with the business websites so you can find the contact email manually.`}
              </p>
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {actionable.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-[12.5px] py-1.5 px-3 bg-bg-2 rounded-lg border border-border">
                    <Globe size={12} strokeWidth={1.5} className="text-fg-3 shrink-0" />
                    <span className="font-medium truncate flex-1">{d.company?.name ?? d.title}</span>
                    <a href={d.company!.website} target="_blank" rel="noopener noreferrer"
                      className="text-fg-3 hover:text-accent truncate max-w-[160px]">
                      {d.company!.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template picker for email / WhatsApp */}
          {(isEmail || isWa) && !noData && !done && (
            <>
              <div>
                <label className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] block mb-1.5">
                  {lang === "es" ? "Plantilla" : "Template"}
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13px] outline-none focus:border-accent"
                >
                  <option value="">{lang === "es" ? "Selecciona una plantilla…" : "Select a template…"}</option>
                  {(isEmail ? emailTemplates : waTemplates).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="bg-bg-2 border border-border rounded-lg p-3 text-[12px] text-fg-1 leading-relaxed max-h-[120px] overflow-y-auto">
                  {isEmail && selectedTemplate.subject && (
                    <div className="font-semibold mb-1 text-fg-2">{lang === "es" ? "Asunto:" : "Subject:"} {selectedTemplate.subject}</div>
                  )}
                  <div className="whitespace-pre-wrap">{selectedTemplate.body.slice(0, 300)}{selectedTemplate.body.length > 300 ? "…" : ""}</div>
                </div>
              )}

              {/* Lead list */}
              <div>
                <label className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] block mb-1.5">
                  {lang === "es" ? "Destinatarios" : "Recipients"} ({actionable.length})
                </label>
                <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                  {actionable.map((d) => (
                    <div key={d.id} className={cn(
                      "flex items-center gap-2 text-[12px] py-1.5 px-3 bg-bg-2 rounded-lg border border-border",
                      progress[d.id] === "ok" && "border-ok/40 bg-ok/5",
                      progress[d.id] === "err" && "border-danger/40 bg-danger/5"
                    )}>
                      {progress[d.id] === "ok" ? (
                        <CheckCircle size={12} className="text-ok shrink-0" />
                      ) : progress[d.id] === "err" ? (
                        <X size={12} className="text-danger shrink-0" />
                      ) : progress[d.id] === "pending" ? (
                        <Loader2 size={12} className="animate-spin text-fg-3 shrink-0" />
                      ) : (
                        isEmail ? <Send size={12} strokeWidth={1.5} className="text-fg-3 shrink-0" />
                               : <MessageCircle size={12} strokeWidth={1.5} className="text-fg-3 shrink-0" />
                      )}
                      <span className="font-medium truncate flex-1">{d.company?.name ?? d.title}</span>
                      <span className="text-fg-3 truncate max-w-[160px]">
                        {isEmail ? d.contact?.email : (d.contact?.phone ?? d.company?.phone)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Done state */}
          {done && (
            <div className="text-center py-6 flex flex-col items-center gap-3">
              <CheckCircle size={36} className="text-ok" />
              <div className="text-[14px] font-semibold">
                {lang === "es" ? "Emails enviados" : "Emails sent"}
              </div>
              <div className="text-[12.5px] text-fg-2">
                {Object.values(progress).filter((v) => v === "ok").length} ok ·{" "}
                {Object.values(progress).filter((v) => v === "err").length} {lang === "es" ? "errores" : "errors"}
              </div>
              <p className="text-[12px] text-fg-2">
                {lang === "es"
                  ? "Los leads enviados se han movido a «Contactado»."
                  : "Leads that were sent have been moved to «Contacted»."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-5 py-4 border-t border-border flex gap-2 justify-end shrink-0">
            <button onClick={onClose} className="px-4 h-9 rounded-lg bg-bg-2 border border-border text-[12.5px] font-medium hover:border-border-strong">
              {t("cancel")}
            </button>
            {isWeb && !noData && (
              <button
                onClick={handleOpenWebs}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105"
              >
                <Globe size={14} strokeWidth={1.8} />
                {lang === "es" ? `Abrir ${actionable.length} webs` : `Open ${actionable.length} sites`}
              </button>
            )}
            {isEmail && !noData && (
              <button
                onClick={handleSendEmail}
                disabled={!selectedTemplateId || sending}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={1.8} />}
                {sending
                  ? (lang === "es" ? "Enviando…" : "Sending…")
                  : (lang === "es" ? `Enviar a ${actionable.length} leads` : `Send to ${actionable.length} leads`)}
              </button>
            )}
            {isWa && !noData && (
              <button
                onClick={handleOpenWhatsApp}
                disabled={!selectedTemplateId}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#25D366] text-white font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-50"
              >
                <MessageCircle size={14} strokeWidth={1.8} />
                {lang === "es" ? `Abrir ${actionable.length} WhatsApp` : `Open ${actionable.length} WhatsApp`}
              </button>
            )}
          </div>
        )}
        {done && (
          <div className="px-5 py-4 border-t border-border flex justify-end shrink-0">
            <button onClick={onClose} className="px-4 h-9 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105">
              {t("close")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

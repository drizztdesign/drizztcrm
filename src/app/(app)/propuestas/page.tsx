"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useDeals } from "@/lib/queries/deals";
import { useProposals, useCreateProposal, useUpdateProposalStatus, useDeleteProposal } from "@/lib/queries/proposals";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { fmtEuro } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Check, Printer, Save, Trash2, Send, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type PkgKey = "esencial" | "profesional" | "premium";

const PACKAGES = (price: number) => [
  {
    key: "esencial" as PkgKey,
    name: "Esencial",
    price: Math.round(price * 0.7),
    items: [
      "Web de 1 página, diseño a medida",
      "Hasta 3 secciones + formulario de contacto",
      "Responsive completo",
      "SEO básico + meta tags",
      "Entrega en 2 semanas",
    ],
  },
  {
    key: "profesional" as PkgKey,
    name: "Profesional",
    price,
    featured: true,
    items: [
      "Web de hasta 6 páginas",
      "Copywriting persuasivo",
      "Integración con Google Analytics + Search Console",
      "SEO técnico + on-page",
      "Formularios inteligentes",
      "Entrega en 3 semanas",
      "1 mes de mantenimiento incluido",
    ],
  },
  {
    key: "premium" as PkgKey,
    name: "Premium",
    price: Math.round(price * 1.4),
    items: [
      "Web ilimitada + CMS a medida",
      "Blog + newsletter",
      "Integración CRM / pagos / reservas",
      "SEO avanzado + contenido inicial",
      "Animaciones & micro-interacciones",
      "Entrega en 5-6 semanas",
      "3 meses de mantenimiento incluidos",
    ],
  },
];

const STATUS_LABEL: Record<string, { es: string; en: string; cls: string }> = {
  draft:    { es: "Borrador", en: "Draft",     cls: "bg-bg-3 text-fg-2" },
  sent:     { es: "Enviada",  en: "Sent",      cls: "bg-blue-500/15 text-blue-400" },
  signed:   { es: "Firmada",  en: "Signed",    cls: "bg-green-500/15 text-green-400" },
  rejected: { es: "Rechazada", en: "Rejected", cls: "bg-red-500/15 text-red-400" },
};

export default function PropuestasPage() {
  const { data: deals = [] } = useDeals();
  const { data: proposals = [], isLoading: loadingProposals } = useProposals();
  const create = useCreateProposal();
  const updateStatus = useUpdateProposalStatus();
  const del = useDeleteProposal();
  const showToast = useUI((s) => s.showToast);
  const { t, lang } = useT();

  const activeDeals = useMemo(() => deals.filter((d) => d.stage !== "lost" && d.stage !== "cerrado"), [deals]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PkgKey>("profesional");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"preview" | "history">("preview");

  const deal = useMemo(() => activeDeals.find((d) => d.id === selectedId) ?? activeDeals[0], [activeDeals, selectedId]);
  const packages = useMemo(() => PACKAGES(deal?.price_estimated ?? 3500), [deal]);
  const pkg = useMemo(() => packages.find((p) => p.key === selectedPkg) ?? packages[1], [packages, selectedPkg]);

  const dealProposals = useMemo(() => proposals.filter((p) => p.deal_id === deal?.id), [proposals, deal]);

  const handleSave = async () => {
    if (!deal) return;
    setSaving(true);
    try {
      await create.mutateAsync({
        deal_id: deal.id,
        package_key: selectedPkg,
        title: `Propuesta ${deal.company?.name ?? deal.title} — ${pkg.name}`,
        items: pkg.items.map((label) => ({ label })),
        subtotal: Math.round(pkg.price / 1.21),
        tax: Math.round(pkg.price - pkg.price / 1.21),
        grand_total: pkg.price,
      });
      showToast(lang === "es" ? "Propuesta guardada" : "Proposal saved", "ok");
      setView("history");
    } catch {
      showToast(lang === "es" ? "Error al guardar" : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      <Topbar
        title={t("nav_proposals")}
        sub={lang === "es" ? "Genera propuestas premium en 2 minutos" : "Build premium proposals in 2 minutes"}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 40px; }
        }
        .print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      <div className="print-area" id="print-area">
        <h1 style={{ fontFamily: "sans-serif", fontSize: 32, marginBottom: 8 }}>Propuesta {deal?.company?.name ?? ""}</h1>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 32 }}>
          Para {deal?.contact?.name ?? "—"} ·{" "}
          {new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444" }}>
          Paquete seleccionado: {pkg.name}
        </h2>
        <p style={{ fontSize: 28, fontWeight: "bold" }}>{fmtEuro(pkg.price, lang)}</p>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          {pkg.items.map((it, i) => <li key={i}>✓ {it}</li>)}
        </ul>
        <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", marginTop: 32 }}>
          Siguiente paso
        </h2>
        <p style={{ fontSize: 13 }}>Confirmar paquete y bloquear slot para arrancar el lunes próximo.</p>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.1em]">
            {lang === "es" ? "Selecciona un lead" : "Pick a lead"}
          </div>
          <div className="border border-border rounded-[12px] bg-bg-1 max-h-[280px] overflow-y-auto">
            {activeDeals.map((d) => {
              const isActive = deal?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => { setSelectedId(d.id); setView("preview"); }}
                  className={cn(
                    "w-full text-left p-3 border-b border-border last:border-b-0 hover:bg-bg-2",
                    isActive && "bg-bg-2 border-l-2 border-l-accent pl-[10px]"
                  )}
                >
                  <div className="text-[13px] font-medium truncate">{d.company?.name ?? d.title}</div>
                  <div className="text-[11px] text-fg-2 mt-0.5 tabular">{fmtEuro(d.price_estimated, lang)}</div>
                </button>
              );
            })}
            {!activeDeals.length && (
              <div className="p-5 text-center text-fg-2 text-sm">{t("empty_title")}</div>
            )}
          </div>

          {/* Package selector */}
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.1em] mt-2">
            {lang === "es" ? "Paquete" : "Package"}
          </div>
          <div className="flex flex-col gap-1.5">
            {packages.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPkg(p.key)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-[10px] border transition-colors",
                  selectedPkg === p.key
                    ? "border-accent bg-accent/10 text-fg-0"
                    : "border-border bg-bg-1 text-fg-1 hover:bg-bg-2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{p.name}</span>
                  <span className="text-[13px] font-semibold tabular">{fmtEuro(p.price, lang)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSave}
              disabled={!deal || saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] bg-accent text-accent-ink text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Save size={13} />
              {saving
                ? (lang === "es" ? "Guardando…" : "Saving…")
                : (lang === "es" ? "Guardar" : "Save")}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-border bg-bg-1 text-fg-1 text-[12.5px] font-medium hover:bg-bg-2 transition-colors"
            >
              <Printer size={13} />
              {lang === "es" ? "Imprimir" : "Print"}
            </button>
          </div>

          {/* History header */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.1em]">
              {lang === "es" ? "Historial" : "History"} ({dealProposals.length})
            </div>
            {dealProposals.length > 0 && (
              <button
                onClick={() => setView(view === "history" ? "preview" : "history")}
                className="text-[11px] text-accent hover:underline"
              >
                {view === "history"
                  ? (lang === "es" ? "Ver preview" : "See preview")
                  : (lang === "es" ? "Ver historial" : "See history")}
              </button>
            )}
          </div>

          {/* History list in sidebar */}
          {loadingProposals ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-bg-1 border border-border rounded-[10px] p-3 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : dealProposals.length === 0 ? (
            <div className="p-4 text-center text-fg-2 text-[12.5px] bg-bg-1 border border-border rounded-[10px]">
              <FileText size={20} className="mx-auto mb-2 opacity-30" />
              {lang === "es"
                ? "Sin propuestas guardadas para este lead"
                : "No saved proposals for this lead"}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {dealProposals.map((p) => {
                const st = STATUS_LABEL[p.status];
                return (
                  <div key={p.id} className="bg-bg-1 border border-border rounded-[10px] p-3 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12.5px] font-medium leading-tight truncate">{p.title}</div>
                      <button
                        onClick={() => del.mutate(p.id)}
                        className="text-fg-3 hover:text-danger shrink-0 mt-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10.5px] px-1.5 py-0.5 rounded-md font-medium", st.cls)}>
                        {lang === "es" ? st.es : st.en}
                      </span>
                      <span className="text-[10.5px] text-fg-3 tabular">
                        {fmtEuro(p.grand_total, lang)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {p.status === "draft" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.id, status: "sent" })}
                          className="flex items-center gap-1 text-[10.5px] text-blue-400 hover:text-blue-300"
                        >
                          <Send size={10} />
                          {lang === "es" ? "Marcar enviada" : "Mark sent"}
                        </button>
                      )}
                      {p.status === "sent" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.id, status: "signed" })}
                          className="flex items-center gap-1 text-[10.5px] text-green-400 hover:text-green-300"
                        >
                          <Check size={10} />
                          {lang === "es" ? "Marcar firmada" : "Mark signed"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview */}
        {view === "preview" && (
          <div className="bg-[#faf8f3] text-[#1a1a1a] rounded-[14px] p-6 sm:p-[56px_64px] min-h-[600px] sm:min-h-[800px] font-serif relative">
            <h1 className="m-0 mb-2 text-[38px] font-semibold -tracking-[0.02em] font-sans">
              Propuesta {deal?.company?.name ?? ""}
            </h1>
            <div className="text-[13px] mb-10 text-[#555] font-sans">
              Preparada para {deal?.contact?.name ?? "—"} ·{" "}
              {new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>

            <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">
              Resumen
            </h2>
            <p className="leading-[1.7] text-[15px]">
              {deal?.notes || "Diseñamos webs que convierten. Esta propuesta cubre tres paquetes adaptados a tu situación."}
            </p>

            <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">
              Paquetes
            </h2>
            <div className="grid grid-cols-3 gap-3.5 mt-4 font-sans max-[900px]:grid-cols-1">
              {packages.map((p) => (
                <div
                  key={p.key}
                  onClick={() => setSelectedPkg(p.key)}
                  className={cn(
                    "border-[1.5px] rounded-[12px] p-4 cursor-pointer transition-all",
                    p.featured
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-[#d4cfc1] bg-white",
                    selectedPkg === p.key && !p.featured && "ring-2 ring-offset-2 ring-[#111]"
                  )}
                >
                  <div className={cn("text-[11px] uppercase tracking-[0.14em] mb-1.5", p.featured ? "text-yellow-400" : "text-[#777]")}>
                    {p.name}
                  </div>
                  <div className="text-[26px] font-bold -tracking-[0.02em] mb-3.5">{fmtEuro(p.price, lang)}</div>
                  <ul className="list-none p-0 m-0 text-[12.5px] leading-[1.7]">
                    {p.items.map((it, i) => (
                      <li key={i} className="flex gap-1.5">
                        <Check
                          size={14}
                          strokeWidth={2}
                          className={p.featured ? "text-yellow-400 shrink-0 mt-0.5" : "text-[#888] shrink-0 mt-0.5"}
                        />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">
              Siguiente paso
            </h2>
            <p className="leading-[1.7] text-[15px]">
              Si te interesa, confirmamos el paquete y bloqueamos slot para arrancar el lunes próximo. Firma digital por DocuSign.
            </p>

            {/* Total */}
            <div className="mt-10 pt-6 border-t border-[#d4cfc1] flex justify-end font-sans">
              <div className="text-right">
                <div className="text-[12px] text-[#777] uppercase tracking-[0.08em] mb-1">
                  {lang === "es" ? "Paquete seleccionado" : "Selected package"}
                </div>
                <div className="text-[32px] font-bold -tracking-[0.02em]">{fmtEuro(pkg.price, lang)}</div>
                <div className="text-[11.5px] text-[#999] mt-0.5">
                  {lang === "es"
                    ? `Base: ${fmtEuro(Math.round(pkg.price / 1.21), lang)} + IVA 21%`
                    : `Base: ${fmtEuro(Math.round(pkg.price / 1.21), lang)} + VAT 21%`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History view */}
        {view === "history" && (
          <div className="flex flex-col gap-4">
            <div className="text-[13.5px] font-semibold">
              {lang === "es" ? "Historial de propuestas" : "Proposals history"} — {deal?.company?.name ?? ""}
            </div>
            {dealProposals.length === 0 ? (
              <div className="bg-bg-1 border border-border rounded-[14px] p-10 text-center text-fg-2">
                <FileText size={32} className="mx-auto mb-3 opacity-20" />
                <div className="text-[14px]">
                  {lang === "es" ? "Sin propuestas guardadas" : "No saved proposals"}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dealProposals.map((p) => {
                  const st = STATUS_LABEL[p.status];
                  return (
                    <div key={p.id} className="bg-bg-1 border border-border rounded-[14px] p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[13.5px] font-medium leading-snug">{p.title}</div>
                          <div className="text-[11.5px] text-fg-2 mt-0.5">
                            {new Date(p.created_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0", st.cls)}>
                          {lang === "es" ? st.es : st.en}
                        </span>
                      </div>
                      <div className="text-[22px] font-semibold tabular -tracking-[0.01em]">
                        {fmtEuro(p.grand_total, lang)}
                      </div>
                      <div className="flex gap-2">
                        {p.status === "draft" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: p.id, status: "sent" })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] border border-border text-[11.5px] text-fg-1 hover:bg-bg-2"
                          >
                            <Send size={11} />
                            {lang === "es" ? "Marcar enviada" : "Mark sent"}
                          </button>
                        )}
                        {p.status === "sent" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: p.id, status: "signed" })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] border border-border text-[11.5px] text-green-400 hover:bg-bg-2"
                          >
                            <Check size={11} />
                            {lang === "es" ? "Marcar firmada" : "Mark signed"}
                          </button>
                        )}
                        <button
                          onClick={() => del.mutate(p.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] border border-border text-[11.5px] text-fg-3 hover:text-danger hover:bg-bg-2 ml-auto"
                        >
                          <Trash2 size={11} />
                          {lang === "es" ? "Eliminar" : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

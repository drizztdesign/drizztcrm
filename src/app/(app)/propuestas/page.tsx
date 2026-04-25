"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useDeals } from "@/lib/queries/deals";
import { useT } from "@/lib/useT";
import { fmtEuro } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

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

export default function PropuestasPage() {
  const { data: deals = [] } = useDeals();
  const { t, lang } = useT();

  const activeDeals = useMemo(() => deals.filter((d) => d.stage !== "lost" && d.stage !== "cerrado"), [deals]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deal = useMemo(() => activeDeals.find((d) => d.id === selectedId) ?? activeDeals[0], [activeDeals, selectedId]);

  const packages = useMemo(() => PACKAGES(deal?.price_estimated ?? 3500), [deal]);

  return (
    <>
      <Topbar title={t("nav_proposals")} sub={lang === "es" ? "Genera propuestas premium en 2 minutos" : "Build premium proposals in 2 minutes"} />
      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.1em]">{lang === "es" ? "Selecciona un lead" : "Pick a lead"}</div>
          <div className="border border-border rounded-[12px] bg-bg-1 max-h-[600px] overflow-y-auto">
            {activeDeals.map((d) => {
              const isActive = (deal?.id === d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
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
            {!activeDeals.length && <div className="p-5 text-center text-fg-2 text-sm">{t("empty_title")}</div>}
          </div>
        </div>

        <div className="bg-[#faf8f3] text-[#1a1a1a] rounded-[14px] p-6 sm:p-[56px_64px] min-h-[600px] sm:min-h-[800px] font-serif relative">
          <h1 className="m-0 mb-2 text-[38px] font-semibold -tracking-[0.02em] font-sans">Propuesta {deal?.company?.name ?? ""}</h1>
          <div className="text-[13px] mb-10 text-[#555] font-sans">
            Preparada para {deal?.contact?.name ?? "—"} · {new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">Resumen</h2>
          <p className="leading-[1.7] text-[15px]">
            {deal?.notes || "Diseñamos webs que convierten. Esta propuesta cubre tres paquetes adaptados a tu situación."}
          </p>

          <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">Paquetes</h2>
          <div className="grid grid-cols-3 gap-3.5 mt-4 font-sans max-[900px]:grid-cols-1">
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                className={cn(
                  "border-[1.5px] rounded-[12px] p-4",
                  pkg.featured ? "border-[#111] bg-[#111] text-white" : "border-[#d4cfc1] bg-white"
                )}
              >
                <div className={cn("text-[11px] uppercase tracking-[0.14em] mb-1.5", pkg.featured ? "text-accent" : "text-[#777]")}>
                  {pkg.name}
                </div>
                <div className="text-[26px] font-bold -tracking-[0.02em] mb-3.5">{fmtEuro(pkg.price, lang)}</div>
                <ul className="list-none p-0 m-0 text-[12.5px] leading-[1.7]">
                  {pkg.items.map((it, i) => (
                    <li key={i} className="flex gap-1.5">
                      <Check size={14} strokeWidth={2} className={pkg.featured ? "text-accent shrink-0 mt-0.5" : "text-[#888] shrink-0 mt-0.5"} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="text-[16px] font-semibold font-sans my-7 mb-2.5 uppercase tracking-[0.08em] text-[#444]">Siguiente paso</h2>
          <p className="leading-[1.7] text-[15px]">
            Si te interesa, confirmamos el paquete y bloqueamos slot para arrancar el lunes próximo. Firma digital por DocuSign.
          </p>
        </div>
      </div>
    </>
  );
}

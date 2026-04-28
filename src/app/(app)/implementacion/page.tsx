"use client";
import { Topbar } from "@/components/layout/Topbar";
import { useT } from "@/lib/useT";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Tool = "hubspot" | "notion" | "airtable";

const TOOL_META: Record<Tool, { icon: string; color: string; labelEs: string; labelEn: string }> = {
  hubspot: { icon: "🟠", color: "orange", labelEs: "HubSpot CRM", labelEn: "HubSpot CRM" },
  notion:  { icon: "⬛", color: "gray",   labelEs: "Notion",      labelEn: "Notion"      },
  airtable:{ icon: "🟡", color: "yellow", labelEs: "Airtable",    labelEn: "Airtable"    },
};

const STEPS: Record<Tool, { es: string; en: string }[]> = {
  hubspot: [
    { es: "Crea cuenta gratuita en HubSpot CRM.", en: "Create a free HubSpot CRM account." },
    { es: "Importa contactos (CSV exportado del CRM).", en: "Import contacts (CSV exported from CRM)." },
    { es: "Crea pipeline con las 7 etapas estándar.", en: "Create the pipeline with the 7 standard stages." },
    { es: "Configura propiedades custom: score, temp, origen, tipo proyecto.", en: "Configure custom properties: score, temp, source, project type." },
    { es: "Activa las workflows para los 10 triggers de automatización.", en: "Enable workflows for the 10 automation triggers." },
  ],
  notion: [
    { es: "Duplica la plantilla 'Sales CRM' en tu workspace.", en: "Duplicate the 'Sales CRM' template in your workspace." },
    { es: "Crea 3 bases: Leads, Contactos, Empresas.", en: "Create 3 databases: Leads, Contacts, Companies." },
    { es: "Vista Kanban por etapa + vista tabla por score.", en: "Kanban view by stage + table view by score." },
    { es: "Usa relations entre bases para ligar empresa ↔ contacto ↔ deal.", en: "Use relations between bases to link company ↔ contact ↔ deal." },
    { es: "Crea botones con Notion AI para generar respuestas.", en: "Create buttons with Notion AI to generate replies." },
  ],
  airtable: [
    { es: "Crea base con 4 tablas: Leads, Tareas, Plantillas, Actividad.", en: "Create a base with 4 tables: Leads, Tasks, Templates, Activity." },
    { es: "Vista Kanban agrupada por Stage.", en: "Kanban view grouped by Stage." },
    { es: "Formulario público para captar leads desde la web.", en: "Public form to capture leads from your website." },
    { es: "Automations: 'at record enters view' → envía email + crea tarea.", en: "Automations: 'at record enters view' → send email + create task." },
    { es: "Dashboard extension con KPIs.", en: "Dashboard extension with KPIs." },
  ],
};

export default function ImplementacionPage() {
  const { t, lang } = useT();
  const [tool, setTool] = useState<Tool>("hubspot");

  return (
    <>
      <Topbar title={t("nav_guide")} sub={lang === "es" ? "Cómo montar algo equivalente en HubSpot, Notion o Airtable" : "How to set up an equivalent in HubSpot, Notion or Airtable"} />
      <div className="flex-1 overflow-auto p-8 max-w-[1300px] mx-auto w-full">
        <div className="grid grid-cols-3 gap-4 mb-8 max-[800px]:grid-cols-1">
          {(["hubspot", "notion", "airtable"] as Tool[]).map((id) => {
            const meta = TOOL_META[id];
            return (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={cn(
                  "bg-bg-1 border border-border rounded-[14px] p-5 text-left transition-all",
                  tool === id ? "border-accent shadow-[0_0_0_1px_var(--accent)] bg-accent/5" : "hover:border-border-strong hover:bg-bg-2"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[28px] leading-none">{meta.icon}</div>
                  <div>
                    <h3 className="m-0 text-[15px] font-semibold">
                      {lang === "es" ? meta.labelEs : meta.labelEn}
                    </h3>
                    <div className="text-[11px] text-fg-2 mt-0.5">
                      {id === "hubspot" && (lang === "es" ? "CRM gratuito, completo" : "Free, full-featured CRM")}
                      {id === "notion" && (lang === "es" ? "Flexibilidad total, workspace" : "Total flexibility, workspace")}
                      {id === "airtable" && (lang === "es" ? "Tablas rápidas, automatizaciones" : "Fast tables, automations")}
                    </div>
                  </div>
                </div>
                <div className="text-[11.5px] text-fg-2">
                  {STEPS[id].length} {lang === "es" ? "pasos" : "steps"} · {lang === "es" ? "≈ 2–3 horas" : "≈ 2–3 hours"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-bg-1 border border-border rounded-[14px] px-6">
          {STEPS[tool].map((s, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-border last:border-b-0">
              <div className="w-7 h-7 rounded-full bg-accent/15 text-accent text-[12px] font-bold grid place-items-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 text-[14px] text-fg-0 leading-[1.6] pt-0.5">
                {lang === "es" ? s.es : s.en}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-accent/10 border border-accent/30 rounded-[14px] p-6 text-center">
          <div className="text-[14px] font-semibold text-fg-0 mb-1">
            {lang === "es" ? "¿Prefieres quedarte en este CRM?" : "Prefer to stay in this CRM?"}
          </div>
          <div className="text-[12.5px] text-fg-2">
            {lang === "es"
              ? "Este CRM ya tiene todo lo que necesitas. Puedes usarlo como tu sistema principal."
              : "This CRM already has everything you need. You can use it as your main system."}
          </div>
        </div>
      </div>
    </>
  );
}

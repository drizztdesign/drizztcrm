"use client";
import { Topbar } from "@/components/layout/Topbar";
import { useT } from "@/lib/useT";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Tool = "hubspot" | "notion" | "airtable";

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
          {(["hubspot", "notion", "airtable"] as Tool[]).map((id) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={cn(
                "bg-bg-1 border border-border rounded-[14px] p-5 text-left transition-colors",
                tool === id ? "border-accent" : "hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-[9px] grid place-items-center font-bold text-[14px] text-white"
                     style={{ background: id === "hubspot" ? "#ff7a59" : id === "notion" ? "#1a1a1a" : "#fcb400" }}>
                  {id[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="m-0 text-[15px] font-semibold capitalize">{id}</h3>
                  <div className="text-[11px] text-fg-2 mt-0.5">
                    {id === "hubspot" && "CRM gratuito, completo"}
                    {id === "notion" && "Flexibilidad total, workspace"}
                    {id === "airtable" && "Tablas rápidas, automatizaciones"}
                  </div>
                </div>
              </div>
              <div className="text-[11.5px] text-fg-2">
                {STEPS[id].length} {lang === "es" ? "pasos" : "steps"} · {lang === "es" ? "≈ 2–3 horas" : "≈ 2–3 hours"}
              </div>
            </button>
          ))}
        </div>

        <div>
          {STEPS[tool].map((s, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr] gap-[18px] py-5 border-b border-border">
              <div className="w-[30px] h-[30px] rounded-full border-[1.5px] border-accent text-accent grid place-items-center font-bold text-[13px] tabular">
                {i + 1}
              </div>
              <div>
                <p className="m-0 text-fg-1 leading-[1.6] text-[13.5px]">{lang === "es" ? s.es : s.en}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

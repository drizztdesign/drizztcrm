"use client";
import { Topbar } from "@/components/layout/Topbar";
import { useAutomations, useToggleAutomation } from "@/lib/queries/templates";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";

export default function AutomatizacionesPage() {
  const { data: autos = [], isLoading } = useAutomations();
  const toggle = useToggleAutomation();
  const { t, lang } = useT();

  return (
    <>
      <Topbar title={t("nav_automations")} sub={lang === "es" ? "10 reglas if-then que trabajan por ti" : "10 if-then rules working for you"} />
      <div className="flex-1 overflow-auto p-6 max-w-[900px] mx-auto w-full">
        {isLoading && <div className="text-fg-2">Cargando…</div>}
        <div className="flex flex-col gap-2.5">
          {autos.map((a) => (
            <div key={a.id} className="bg-bg-1 border border-border rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-[42px] h-[42px] rounded-[10px] bg-bg-3 grid place-items-center text-[20px] shrink-0">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium mb-1">{a.name}</div>
                <div className="text-[11.5px] text-fg-2 leading-[1.5]">
                  {lang === "es" ? a.description_es : a.description_en}
                </div>
              </div>
              <div className="text-right text-[11px] text-fg-2 shrink-0 mr-2">
                <b className="block text-fg-0 text-[14px] font-semibold tabular">{a.stats.fires}</b>
                {lang === "es" ? "ejecuciones" : "runs"}
              </div>
              <button
                onClick={() => toggle.mutate({ id: a.id, enabled: !a.enabled })}
                className={cn("switch", a.enabled && "on")}
                aria-label="toggle automation"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

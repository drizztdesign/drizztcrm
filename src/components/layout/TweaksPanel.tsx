"use client";
import { useState } from "react";
import { X, LogOut, Trash2, Download, RefreshCw } from "lucide-react";
import { useUI } from "@/store/ui";
import { useTweaks, type Density } from "@/store/tweaks";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDeals } from "@/lib/queries/deals";
import { dealsToCSV, downloadCSV } from "@/lib/csv";

const ACCENTS = [
  "#a8ff3e", "#6bfdff", "#ff7a59", "#b288ff", "#f5b544", "#4ac38a", "#e77fc1", "#6aa7ff",
];

export function TweaksPanel() {
  const open = useUI((s) => s.tweaksOpen);
  const setOpen = useUI((s) => s.setTweaksOpen);
  const show = useUI((s) => s.showToast);
  const { t, lang } = useT();
  const { setLang, accent, setAccent, density, setDensity } = useTweaks();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: deals = [] } = useDeals();
  const [clearing, setClearing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  if (!open) return null;

  const exportCSV = () => {
    const csv = dealsToCSV(deals);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`drizzt-crm-leads-${date}.csv`, csv);
    show(lang === "es" ? `${deals.length} leads exportados` : `${deals.length} leads exported`, "ok");
  };

  const recomputeScores = async () => {
    setRecomputing(true);
    const { data, error } = await createClient().rpc("recompute_all_scores");
    setRecomputing(false);
    if (error) {
      show(error.message, "error");
    } else {
      show(
        lang === "es" ? `Scoring recalculado en ${data ?? 0} leads` : `Scoring recomputed for ${data ?? 0} leads`,
        "ok"
      );
      qc.invalidateQueries({ queryKey: ["deals"] });
    }
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const clearAllData = async () => {
    setClearing(true);
    const { error } = await createClient().rpc("clear_user_data");
    setClearing(false);
    setConfirming(false);
    if (error) {
      show(error.message, "error");
    } else {
      show(lang === "es" ? "Datos eliminados" : "Data cleared", "ok");
      qc.invalidateQueries();
      setOpen(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 backdrop-enter" onClick={() => setOpen(false)} />
      <aside className="fixed top-0 right-0 bottom-0 w-[380px] max-w-[92vw] bg-bg-1 border-l border-border z-50 drawer-enter flex flex-col">
        <div className="p-[18px_22px] border-b border-border flex items-center justify-between">
          <h2 className="m-0 text-[16px] font-semibold">{t("tweaks_title") || (lang === "es" ? "Ajustes" : "Settings")}</h2>
          <button onClick={() => setOpen(false)} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[18px_22px] flex flex-col gap-6">
          <Section label={lang === "es" ? "Idioma" : "Language"}>
            <div className="flex gap-2">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] border",
                    lang === l ? "bg-accent-soft border-accent text-accent" : "bg-bg-2 border-border text-fg-1 hover:border-border-strong"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </Section>

          <Section label={lang === "es" ? "Color acento" : "Accent color"}>
            <div className="flex gap-2 flex-wrap">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  style={{ background: c }}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-transform hover:scale-110",
                    accent === c && "ring-2 ring-offset-2 ring-offset-bg-1 ring-fg-0"
                  )}
                />
              ))}
            </div>
          </Section>

          <Section label={lang === "es" ? "Densidad" : "Density"}>
            <div className="flex gap-2">
              {(["compact", "regular", "cozy"] as Density[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] border capitalize",
                    density === d ? "bg-accent-soft border-accent text-accent" : "bg-bg-2 border-border text-fg-1 hover:border-border-strong"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Section>

          <Section label={lang === "es" ? "Datos" : "Data"}>
            <button
              onClick={exportCSV}
              disabled={deals.length === 0}
              className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-border-strong text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
            >
              <Download size={14} strokeWidth={1.5} />
              {lang === "es" ? `Descargar leads CSV (${deals.length})` : `Download leads CSV (${deals.length})`}
            </button>
            <button
              onClick={recomputeScores}
              disabled={recomputing || deals.length === 0}
              className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-border-strong text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={14} strokeWidth={1.5} className={recomputing ? "animate-spin" : ""} />
              {recomputing
                ? lang === "es" ? "Recalculando…" : "Recomputing…"
                : lang === "es" ? "Recalcular scoring" : "Recompute scoring"}
            </button>
            <button
              onClick={() => {
                qc.invalidateQueries();
                show(lang === "es" ? "Datos actualizados" : "Data refreshed", "ok");
              }}
              className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-border-strong text-[13px] font-medium flex items-center justify-center gap-2 mt-2"
            >
              <RefreshCw size={14} strokeWidth={1.5} />
              {lang === "es" ? "Recargar todos los datos" : "Refresh all data"}
            </button>
            <p className="text-[11px] text-fg-2 mt-2 leading-relaxed">
              {lang === "es"
                ? "El scoring se recalcula solo al editar un lead. Usa este botón para reaplicar las reglas a todos tras cambiar pesos."
                : "Scoring auto-recalculates when you edit a lead. Use this button to reapply rules to all leads after changing weights."}
            </p>
          </Section>

          <Section label={lang === "es" ? "Zona de peligro" : "Danger zone"}>
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-danger hover:text-danger text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                {lang === "es" ? "Borrar todos mis datos" : "Delete all my data"}
              </button>
            ) : (
              <div className="border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
                <div className="text-[12.5px] text-fg-1 leading-relaxed">
                  {lang === "es"
                    ? "Esto eliminará TODOS tus leads, empresas, contactos, tareas y conversaciones. Plantillas, automatizaciones y reglas de scoring se mantienen. ¿Seguro?"
                    : "This will delete ALL your leads, companies, contacts, tasks and conversations. Templates, automations and scoring rules are kept. Sure?"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={clearing}
                    className="flex-1 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium hover:border-border-strong disabled:opacity-60"
                  >
                    {lang === "es" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    onClick={clearAllData}
                    disabled={clearing}
                    className="flex-1 h-9 rounded-md bg-danger text-white text-[12.5px] font-semibold hover:brightness-110 disabled:opacity-60"
                  >
                    {clearing ? (lang === "es" ? "Borrando…" : "Deleting…") : (lang === "es" ? "Sí, borrar todo" : "Yes, delete all")}
                  </button>
                </div>
              </div>
            )}
          </Section>

        </div>

        <div className="p-[16px_22px] border-t border-border">
          <button
            onClick={logout}
            className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-danger hover:text-danger text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">{label}</div>
      {children}
    </div>
  );
}

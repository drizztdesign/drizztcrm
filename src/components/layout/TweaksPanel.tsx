"use client";
import { X, LogOut } from "lucide-react";
import { useUI } from "@/store/ui";
import { useTweaks, type Density } from "@/store/tweaks";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [seeding, setSeeding] = useState(false);

  if (!open) return null;

  const seedDemo = async () => {
    setSeeding(true);
    const sb = createClient();
    const { error } = await sb.rpc("seed_demo_data");
    setSeeding(false);
    if (error) {
      show(error.message, "error");
    } else {
      show(lang === "es" ? "Datos de ejemplo cargados" : "Demo data loaded", "ok");
      setOpen(false);
      router.refresh();
      window.location.reload();
    }
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
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
              onClick={seedDemo}
              disabled={seeding}
              className="w-full h-10 rounded-lg bg-bg-2 border border-border hover:border-border-strong text-[13px] font-medium disabled:opacity-60"
            >
              {seeding ? t("seeding") : t("seed_demo")}
            </button>
            <p className="text-[11px] text-fg-2 mt-2 leading-relaxed">
              {lang === "es"
                ? "Reemplaza tus datos con 16 leads de demo. No se pueden recuperar los datos eliminados."
                : "Replaces your data with 16 demo leads. Deleted data cannot be recovered."}
            </p>
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

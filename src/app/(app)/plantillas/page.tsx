"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useTemplates } from "@/lib/queries/templates";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Copy, Mail, MessageCircle } from "lucide-react";
import { Instagram, Linkedin } from "@/components/icons/BrandIcons";

const CHANNEL_ICON = {
  whatsapp: MessageCircle,
  email: Mail,
  instagram: Instagram,
  linkedin: Linkedin,
} as const;

export default function PlantillasPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { t, lang } = useT();
  const show = useUI((s) => s.showToast);
  const search = useUI((s) => s.search);
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter((x) => x.title.toLowerCase().includes(q) || x.body.toLowerCase().includes(q));
  }, [templates, search]);

  const active = useMemo(() => filtered.find((x) => x.id === activeId) ?? filtered[0], [filtered, activeId]);

  const copy = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.body);
    show(t("toast_copied") || (lang === "es" ? "Copiado" : "Copied"), "ok");
  };

  return (
    <>
      <Topbar title={t("nav_templates")} sub={`${templates.length} ${lang === "es" ? "plantillas" : "templates"} · persuasivas, probadas`} />
      <div className="flex-1 overflow-hidden grid grid-cols-[320px_1fr] gap-5 p-6 max-w-[1400px] mx-auto w-full">
        <div className="border border-border rounded-[12px] bg-bg-1 overflow-y-auto">
          {isLoading && <div className="p-4 text-fg-2 text-sm">Cargando…</div>}
          {filtered.map((tpl) => {
            const Icon = CHANNEL_ICON[tpl.channel] ?? MessageCircle;
            const isActive = (active?.id === tpl.id);
            return (
              <button
                key={tpl.id}
                onClick={() => setActiveId(tpl.id)}
                className={cn(
                  "w-full text-left p-3 border-b border-border last:border-b-0 hover:bg-bg-2 transition-colors",
                  isActive && "bg-bg-2 border-l-2 border-l-accent pl-[10px]"
                )}
              >
                <div className="text-[13px] font-medium mb-1">{tpl.title}</div>
                <div className="text-[11px] text-fg-2 flex gap-1.5 items-center">
                  <Icon size={11} strokeWidth={1.5} />
                  <span className="capitalize">{tpl.channel}</span>
                  <span className="text-fg-3">·</span>
                  <span>{tpl.stage}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border border-border rounded-[12px] bg-bg-1 flex flex-col overflow-hidden">
          {active && (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div>
                  <div className="text-[14px] font-semibold">{active.title}</div>
                  <div className="text-[11px] text-fg-2 mt-0.5 capitalize">{active.channel} · {active.stage}</div>
                </div>
                <button onClick={copy} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-ink font-semibold text-[12px]">
                  <Copy size={13} strokeWidth={1.8} />
                  {t("tpl_copy") || (lang === "es" ? "Copiar" : "Copy")}
                </button>
              </div>
              <div className="px-7 py-6 overflow-y-auto flex-1">
                {active.subject && (
                  <div className="text-[15px] font-semibold pb-3 mb-3.5 border-b border-border">{renderPlaceholders(active.subject)}</div>
                )}
                <pre className="m-0 whitespace-pre-wrap font-sans text-[13.5px] leading-[1.7] text-fg-1">{renderPlaceholders(active.body)}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function renderPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((p, i) =>
    p.match(/^\{\{(\w+)\}\}$/) ? (
      <span key={i} className="bg-accent-soft text-accent rounded px-1.5 py-0.5 font-mono text-[12px]">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

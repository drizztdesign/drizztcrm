"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Building2, Users, Inbox, Zap } from "lucide-react";
import { useUI } from "@/store/ui";
import { useDeals } from "@/lib/queries/deals";
import { useContacts, useCompanies } from "@/lib/queries/contacts";
import { useTasks } from "@/lib/queries/tasks";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";

type Result =
  | { kind: "deal"; id: string; title: string; sub: string; dealId: string }
  | { kind: "company"; id: string; title: string; sub: string; name: string }
  | { kind: "contact"; id: string; title: string; sub: string; email: string }
  | { kind: "task"; id: string; title: string; sub: string; dealId: string | null }
  | { kind: "action"; id: string; title: string; sub: string; href: string };

const ICON: Record<Result["kind"], React.ElementType> = {
  deal: Briefcase,
  company: Building2,
  contact: Users,
  task: Inbox,
  action: Zap,
};

const SECTION_LABEL_ES: Record<Result["kind"], string> = {
  deal: "Leads",
  company: "Empresas",
  contact: "Contactos",
  task: "Tareas",
  action: "Acciones rápidas",
};
const SECTION_LABEL_EN: Record<Result["kind"], string> = {
  deal: "Leads",
  company: "Companies",
  contact: "Contacts",
  task: "Tasks",
  action: "Quick actions",
};

export function CommandPalette() {
  const open = useUI((s) => s.cmdOpen);
  const setOpen = useUI((s) => s.setCmdOpen);
  const setSearch = useUI((s) => s.setSearch);
  const openDeal = useUI((s) => s.openDeal);
  const router = useRouter();
  const { lang } = useT();

  const { data: deals = [] } = useDeals();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { data: tasks = [] } = useTasks();

  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl/Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!q.trim()) {
      return [
        { kind: "action" as const, id: "action-new-lead", title: lang === "es" ? "Nuevo lead" : "New lead", sub: lang === "es" ? "Abrir formulario de nuevo lead" : "Open new lead form", href: "new-lead" },
        { kind: "action" as const, id: "action-pipeline", title: lang === "es" ? "Ir al Pipeline" : "Go to Pipeline", sub: lang === "es" ? "Ver todos los leads en Kanban" : "View all leads in Kanban", href: "/pipeline" },
        { kind: "action" as const, id: "action-dashboard", title: lang === "es" ? "Ir al Dashboard" : "Go to Dashboard", sub: lang === "es" ? "Métricas del negocio" : "Business metrics", href: "/dashboard" },
        ...deals.slice(0, 4).map<Result>((d) => ({
          kind: "deal",
          id: `deal-${d.id}`,
          title: d.company?.name ?? d.title,
          sub: `${d.title} · ${d.code}`,
          dealId: d.id,
        })),
      ];
    }
    const needle = q.toLowerCase();
    const out: Result[] = [];

    for (const d of deals) {
      const hay = [d.title, d.code, d.company?.name ?? "", d.contact?.name ?? "", d.company?.city ?? ""]
        .join(" ").toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          kind: "deal",
          id: `deal-${d.id}`,
          title: d.company?.name ?? d.title,
          sub: `${d.title} · ${d.code}`,
          dealId: d.id,
        });
        if (out.filter((x) => x.kind === "deal").length >= 5) break;
      }
    }

    for (const c of companies) {
      const hay = [c.name, c.sector, c.city, c.website].join(" ").toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          kind: "company",
          id: `company-${c.id}`,
          title: c.name,
          sub: [c.sector, c.city].filter(Boolean).join(" · ") || "—",
          name: c.name,
        });
        if (out.filter((x) => x.kind === "company").length >= 5) break;
      }
    }

    for (const c of contacts) {
      const hay = [c.name, c.email, c.role, c.company?.name ?? ""].join(" ").toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          kind: "contact",
          id: `contact-${c.id}`,
          title: c.name,
          sub: [c.role, c.email, c.company?.name].filter(Boolean).join(" · ") || "—",
          email: c.email ?? "",
        });
        if (out.filter((x) => x.kind === "contact").length >= 5) break;
      }
    }

    for (const t of tasks) {
      const hay = [t.title, t.due].join(" ").toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          kind: "task",
          id: `task-${t.id}`,
          title: t.title,
          sub: [t.due, t.deal?.title].filter(Boolean).join(" · ") || "—",
          dealId: t.deal?.id ?? null,
        });
        if (out.filter((x) => x.kind === "task").length >= 5) break;
      }
    }

    return out;
  }, [q, deals, companies, contacts, tasks, lang]);

  // Keep active index in range
  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results.length, active]);

  const select = (r: Result) => {
    if (r.kind === "deal") {
      setOpen(false);
      openDeal(r.dealId);
    } else if (r.kind === "company") {
      setSearch(r.name);
      router.push("/pipeline");
      setOpen(false);
    } else if (r.kind === "contact") {
      router.push("/contactos");
      setOpen(false);
    } else if (r.kind === "task") {
      if (r.dealId) openDeal(r.dealId);
      else router.push("/tareas");
      setOpen(false);
    } else if (r.kind === "action") {
      if (r.href === "new-lead") {
        setOpen(false);
        // dispatch a custom event to open the new lead dialog
        window.dispatchEvent(new CustomEvent("crm:new-lead"));
      } else {
        router.push(r.href);
        setOpen(false);
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      select(results[active]);
    }
  };

  if (!open) return null;

  // Group results by kind preserving order
  const grouped = results.reduce<Record<Result["kind"], Result[]>>(
    (acc, r) => {
      (acc[r.kind] ||= []).push(r);
      return acc;
    },
    { deal: [], company: [], contact: [], task: [], action: [] }
  );
  const flat = results;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[60] backdrop-enter" onClick={() => setOpen(false)} />
      <div className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[640px] max-w-[92vw] bg-bg-1 border border-border rounded-2xl z-[61] drawer-enter shadow-pop overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-bg-1">
          <Search size={16} strokeWidth={1.5} className="text-fg-2 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={lang === "es" ? "Buscar leads, empresas, contactos, tareas…" : "Search leads, companies, contacts, tasks…"}
            className="flex-1 bg-transparent border-0 outline-none text-[14.5px] text-fg-0 placeholder:text-fg-3"
          />
          <span className="text-[10.5px] text-fg-3 border border-border rounded px-1.5 py-0.5 font-mono">esc</span>
        </div>

        <div className="overflow-y-auto flex-1">
          {flat.length === 0 ? (
            <div className="p-8 text-center text-fg-2 text-sm">
              {q ? (lang === "es" ? "Sin resultados" : "No results") : (lang === "es" ? "Empieza a escribir…" : "Start typing…")}
            </div>
          ) : (
            (Object.keys(grouped) as Result["kind"][]).map((kind) => {
              const items = grouped[kind];
              if (!items.length) return null;
              const Icon = ICON[kind];
              return (
                <div key={kind}>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-fg-3 uppercase tracking-[0.14em]">
                    {lang === "es" ? SECTION_LABEL_ES[kind] : SECTION_LABEL_EN[kind]}
                  </div>
                  {items.map((r) => {
                    const idx = flat.indexOf(r);
                    const isActive = idx === active;
                    return (
                      <button
                        key={r.id}
                        onClick={() => select(r)}
                        onMouseMove={() => setActive(idx)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 flex items-center gap-3",
                          isActive ? "bg-bg-2" : "hover:bg-bg-2"
                        )}
                      >
                        <Icon size={15} strokeWidth={1.5} className={cn("shrink-0", isActive ? "text-accent" : "text-fg-2")} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium truncate">{r.title}</div>
                          <div className="text-[11.5px] text-fg-2 truncate">{r.sub}</div>
                        </div>
                        {isActive && (
                          <span className="text-[10.5px] text-fg-3 border border-border rounded px-1.5 py-0.5 font-mono">↵</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-bg-2 text-[10.5px] text-fg-3 flex items-center gap-3">
          <span><kbd className="font-mono">↑↓</kbd> {lang === "es" ? "navegar" : "navigate"}</span>
          <span><kbd className="font-mono">↵</kbd> {lang === "es" ? "abrir" : "open"}</span>
          <span><kbd className="font-mono">esc</kbd> {lang === "es" ? "cerrar" : "close"}</span>
        </div>
      </div>
    </>
  );
}

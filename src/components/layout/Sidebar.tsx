"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Home, Kanban, Users, Building2, Activity, LayoutDashboard, Inbox,
  FileText, Sparkles, Target, Zap, Book, Settings, X,
} from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/cn";
import { useUI } from "@/store/ui";

const NAV = [
  { section: "main", items: [
    { href: "/inicio",           icon: Home,              key: "nav_home" },
    { href: "/pipeline",         icon: Kanban,            key: "nav_pipeline" },
    { href: "/contactos",        icon: Users,             key: "nav_contacts" },
    { href: "/empresas",         icon: Building2,         key: "nav_companies" },
    { href: "/actividades",      icon: Activity,          key: "nav_activity" },
    { href: "/dashboard",        icon: LayoutDashboard,   key: "nav_dashboard" },
    { href: "/tareas",           icon: Inbox,             key: "nav_tasks" },
  ]},
  { section: "sales", items: [
    { href: "/plantillas",       icon: FileText,          key: "nav_templates" },
    { href: "/propuestas",       icon: Sparkles,          key: "nav_proposals" },
    { href: "/scoring",          icon: Target,            key: "nav_scoring" },
  ]},
  { section: "system", items: [
    { href: "/automatizaciones", icon: Zap,               key: "nav_automations" },
    { href: "/implementacion",   icon: Book,              key: "nav_guide" },
  ]},
] as const;

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const { t } = useT();
  const toggleTweaks = useUI((s) => s.toggleTweaks);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);

  // close sidebar when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "fixed md:static top-0 left-0 bottom-0 w-[260px] md:w-[240px] shrink-0 bg-bg-1 border-r border-border flex flex-col gap-1 p-[16px_10px] overflow-y-auto z-50 transition-transform md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-[10px] p-[8px_10px_20px]">
          <div
            className="w-8 h-8 rounded-lg grid place-items-center text-[16px] font-extrabold text-[#0a0b0d]"
            style={{
              background: "radial-gradient(120% 120% at 0% 0%, var(--accent) 0%, #4a7c1f 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
            }}
          >
            D
          </div>
          <div className="flex flex-col leading-[1.1] flex-1">
            <strong className="text-[13px] tracking-[0.02em] font-bold">DRIZZT</strong>
            <span className="text-[10px] text-fg-2 tracking-[0.16em] uppercase font-medium">CRM · Design</span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-fg-2 hover:text-fg-0 p-1"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {NAV.map((section, i) => (
          <div key={i}>
            <div className="px-3 pt-[14px] pb-[6px] text-[10px] font-semibold tracking-[0.14em] uppercase text-fg-3">
              {t(`nav_section_${section.section}`)}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-[10px] px-[10px] py-2 rounded-lg text-[13.5px] font-medium transition-colors min-h-[44px] md:min-h-[34px]",
                    active ? "bg-bg-2 text-fg-0" : "text-fg-1 hover:bg-bg-2 hover:text-fg-0"
                  )}
                >
                  {active && (
                    <span
                      className="absolute -left-[10px] top-2 bottom-2 w-[3px] rounded-r-[3px] bg-accent"
                      aria-hidden
                    />
                  )}
                  <Icon size={18} strokeWidth={1.5} className={active ? "text-accent" : "text-fg-2"} />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="mt-auto border-t border-border pt-3 flex items-center gap-[10px] p-[10px]">
          <div
            className="w-7 h-7 rounded-full bg-accent text-accent-ink grid place-items-center text-[11px] font-bold"
          >
            {userEmail.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 leading-[1.2]">
            <b className="text-[12.5px] block truncate">{userEmail.split("@")[0]}</b>
            <span className="text-[10.5px] text-fg-2 truncate block">{userEmail}</span>
          </div>
          <button
            onClick={toggleTweaks}
            aria-label="Settings"
            className="text-fg-2 hover:text-fg-0 p-2 -m-2 rounded transition-colors"
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  );
}

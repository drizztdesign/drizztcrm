"use client";
import { useState } from "react";
import { Search, Plus, Menu } from "lucide-react";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { NewLeadDialog } from "@/components/lead/NewLeadDialog";

export function Topbar({ title, sub }: { title: string; sub?: string }) {
  const { t } = useT();
  const search = useUI((s) => s.search);
  const setSearch = useUI((s) => s.setSearch);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-[22px] py-3 border-b border-border bg-bg-0 min-h-[56px] shrink-0">
      <button
        onClick={toggleSidebar}
        aria-label="Open menu"
        className="md:hidden h-9 w-9 grid place-items-center rounded-lg border border-border bg-bg-2 text-fg-1 hover:bg-bg-3 shrink-0"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <div className="flex flex-col leading-tight min-w-0 flex-1 sm:flex-initial">
        <h1 className="m-0 text-[15px] sm:text-[17px] font-semibold -tracking-[0.01em] truncate">{title}</h1>
        {sub && <span className="text-[11px] sm:text-[12px] text-fg-2 mt-0.5 truncate hidden sm:block">{sub}</span>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-bg-2 border border-border rounded-lg px-[10px] py-[6px] w-[260px] lg:w-[320px] text-fg-2">
          <Search size={14} strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className="bg-transparent border-0 outline-none w-full text-[13px] text-fg-0 placeholder:text-fg-3"
          />
          <span className="text-[10.5px] text-fg-3 border border-border rounded px-1 py-px font-mono">⌘K</span>
        </div>

        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-9 sm:h-auto sm:py-[7px] rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 shrink-0"
        >
          <Plus size={14} strokeWidth={2} />
          <span className="hidden sm:inline">{t("new_lead")}</span>
        </button>
      </div>
      <NewLeadDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

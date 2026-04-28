"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useContacts } from "@/lib/queries/contacts";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { avatarGradient, mailtoLink, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Mail, MessageCircle, Phone, Pencil } from "lucide-react";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import type { Contact, Company } from "@/lib/supabase/types";

export default function ContactosPage() {
  const { data: contacts = [], isLoading } = useContacts();
  const { t, lang } = useT();
  const search = useUI((s) => s.search);
  const [sector, setSector] = useState<string>("all");
  const [editing, setEditing] = useState<(Contact & { company?: Company | null }) | null>(null);

  const sectors = useMemo(() => {
    const s = new Set(contacts.map((c) => c.company?.sector).filter(Boolean) as string[]);
    return ["all", ...Array.from(s).sort()];
  }, [contacts]);

  const filtered = useMemo(() => {
    let out = contacts;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company?.name ?? "").toLowerCase().includes(q) ||
        (c.company?.city ?? "").toLowerCase().includes(q)
      );
    }
    if (sector !== "all") out = out.filter((c) => c.company?.sector === sector);
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, search, sector]);

  return (
    <>
      <Topbar title={t("nav_contacts")} sub={`${contacts.length} ${lang === "es" ? "contactos" : "contacts"}`} />
      <div className="px-[22px] py-2.5 border-b border-border flex items-center gap-2 overflow-x-auto">
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className={cn(
              "inline-flex items-center px-2.5 py-1 text-[11.5px] rounded-md border whitespace-nowrap",
              sector === s ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border hover:border-border-strong"
            )}
          >
            {s === "all" ? t("all") : s}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-bg-1 border border-border rounded-[14px] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2 mt-1">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && (
          <div className="grid grid-cols-3 max-[1200px]:grid-cols-2 max-[800px]:grid-cols-1 gap-3.5">
            {filtered.map((c) => (
              <div key={c.id} className="bg-bg-1 border border-border rounded-xl p-3.5 flex items-start gap-3 hover:border-border-strong hover:bg-bg-2 transition-colors group relative">
                <div
                  className="w-10 h-10 rounded-[10px] grid place-items-center text-[13px] font-semibold text-white shrink-0"
                  style={{ background: avatarGradient(c.id) }}
                >
                  {c.avatar || c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{c.name}</div>
                  <div className="text-[11.5px] text-fg-2 truncate">{c.role || "—"} · {c.company?.name ?? "—"}</div>
                  <div className="text-[11px] text-fg-3 mt-1 truncate">
                    {c.company?.sector} · {c.company?.city}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {c.phone && (
                      <a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-3 rounded-md text-[11px] text-fg-1 hover:text-accent">
                        <MessageCircle size={10} strokeWidth={1.5} />
                        WhatsApp
                      </a>
                    )}
                    {c.email && (
                      <a href={mailtoLink(c.email)} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-3 rounded-md text-[11px] text-fg-1 hover:text-accent">
                        <Mail size={10} strokeWidth={1.5} />
                        Email
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-3 rounded-md text-[11px] text-fg-1 hover:text-accent">
                        <Phone size={10} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(c)}
                  className="absolute top-2 right-2 p-1.5 rounded-md text-fg-3 hover:text-accent hover:bg-bg-3 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-60"
                  aria-label="Edit contact"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-2">
                <div className="text-[40px] opacity-20">👤</div>
                <div className="text-[14px] font-medium text-fg-1">
                  {search ? (lang === "es" ? "Sin resultados" : "No results") : (lang === "es" ? "Sin contactos aún" : "No contacts yet")}
                </div>
                <div className="text-[12.5px] text-fg-2">
                  {search
                    ? (lang === "es" ? `Nada coincide con "${search}"` : `Nothing matches "${search}"`)
                    : (lang === "es" ? "Los contactos se crean al añadir un lead en el pipeline." : "Contacts are created when you add a lead in the pipeline.")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <EditContactDialog contact={editing} onClose={() => setEditing(null)} />
    </>
  );
}

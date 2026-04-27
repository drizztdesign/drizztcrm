"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useCompanies } from "@/lib/queries/contacts";
import { useDeals } from "@/lib/queries/deals";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { fmtEuro, avatarGradient } from "@/lib/format";
import { Globe, MapPin, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import { EditCompanyDialog } from "@/components/contacts/EditCompanyDialog";
import type { Company } from "@/lib/supabase/types";

export default function EmpresasPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: deals = [] } = useDeals();
  const { t, lang } = useT();
  const search = useUI((s) => s.search);
  const setSearch = useUI((s) => s.setSearch);
  const openDeal = useUI((s) => s.openDeal);
  const router = useRouter();
  const [editing, setEditing] = useState<Company | null>(null);

  const onCompanyClick = (companyId: string, companyName: string) => {
    const own = deals.filter((d) => d.company_id === companyId);
    if (own.length === 1) {
      openDeal(own[0].id);
    } else if (own.length > 1) {
      setSearch(companyName);
      router.push("/pipeline");
    }
  };

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.website.toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <>
      <Topbar title={t("nav_companies")} sub={`${companies.length} ${lang === "es" ? "empresas" : "companies"}`} />
      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[1400px] mx-auto w-full">
        {isLoading && <div className="text-fg-2 text-sm">Cargando…</div>}
        {!isLoading && (
          <>
            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-2">
              {filtered.map((c) => {
                const own = deals.filter((d) => d.company_id === c.id);
                const value = own.reduce((a, d) => a + (d.price_closed ?? d.price_offered ?? d.price_estimated ?? 0), 0);
                return (
                  <div
                    key={c.id}
                    onClick={() => onCompanyClick(c.id, c.name)}
                    className={cn(
                      "bg-bg-1 border border-border rounded-xl p-3 flex items-start gap-3 group relative",
                      own.length > 0 ? "hover:bg-bg-2 cursor-pointer active:bg-bg-2" : "opacity-70"
                    )}
                  >
                    <div className="w-10 h-10 rounded-md text-[12px] font-semibold text-white grid place-items-center shrink-0" style={{ background: avatarGradient(c.id) }}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-7">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-fg-0 text-[14px] truncate">{c.name}</span>
                        <span className="text-[11px] text-fg-3 tabular shrink-0">{own.length} {lang === "es" ? "deals" : "deals"}</span>
                      </div>
                      <div className="text-[12px] text-fg-2 mt-0.5 truncate">
                        {c.sector || "—"}{c.city ? ` · ${c.city}` : ""}
                      </div>
                      {c.website && (
                        <a
                          href={`https://${c.website.replace(/^https?:\/\//, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11.5px] mono text-fg-3 hover:text-accent inline-flex items-center gap-1 mt-1"
                        >
                          <Globe size={11} strokeWidth={1.5} />{c.website}
                        </a>
                      )}
                      {value > 0 && (
                        <div className="text-[13px] font-medium tabular mt-1.5">{fmtEuro(value, lang)}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(c); }}
                      className="absolute top-2 right-2 p-1.5 rounded-md text-fg-3 hover:text-accent hover:bg-bg-3 max-md:opacity-60 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Edit company"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
              {!filtered.length && <div className="text-center text-fg-2 py-10">{t("empty_title")}</div>}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-bg-1 border border-border rounded-[14px] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{lang === "es" ? "Empresa" : "Company"}</th>
                    <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_sector")}</th>
                    <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_city")}</th>
                    <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_web")}</th>
                    <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">Deals</th>
                    <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{lang === "es" ? "Valor" : "Value"}</th>
                    <th className="w-[40px] border-b border-border bg-bg-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const own = deals.filter((d) => d.company_id === c.id);
                    const value = own.reduce((a, d) => a + (d.price_closed ?? d.price_offered ?? d.price_estimated ?? 0), 0);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => onCompanyClick(c.id, c.name)}
                        className={cn(
                          "border-b border-border last:border-b-0 group",
                          own.length > 0 ? "hover:bg-bg-2 cursor-pointer" : "opacity-70"
                        )}
                      >
                        <td className="py-3 px-[14px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md text-[11px] font-semibold text-white grid place-items-center" style={{ background: avatarGradient(c.id) }}>
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-fg-0">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-[14px] text-fg-1">{c.sector || "—"}</td>
                        <td className="py-3 px-[14px] text-fg-1 inline-flex items-center gap-1"><MapPin size={11} strokeWidth={1.5} />{c.city || "—"}</td>
                        <td className="py-3 px-[14px] text-fg-2 mono text-[12px]">
                          {c.website ? <a href={`https://${c.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 hover:text-accent"><Globe size={11} strokeWidth={1.5} />{c.website}</a> : "—"}
                        </td>
                        <td className="py-3 px-[14px] text-right text-fg-2 tabular">{own.length}</td>
                        <td className="py-3 px-[14px] text-right font-medium tabular">{fmtEuro(value, lang)}</td>
                        <td className="py-3 pr-[10px] w-[40px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(c); }}
                            className="p-1.5 rounded-md text-fg-3 hover:text-accent hover:bg-bg-3 opacity-0 group-hover:opacity-100"
                            aria-label="Edit company"
                          >
                            <Pencil size={13} strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (
                    <tr><td colSpan={7} className="py-10 text-center text-fg-2">{t("empty_title")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <EditCompanyDialog company={editing} onClose={() => setEditing(null)} />
    </>
  );
}

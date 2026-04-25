"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useCompanies } from "@/lib/queries/contacts";
import { useDeals } from "@/lib/queries/deals";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { fmtEuro, avatarGradient } from "@/lib/format";
import { Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

export default function EmpresasPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: deals = [] } = useDeals();
  const { t, lang } = useT();
  const search = useUI((s) => s.search);
  const setSearch = useUI((s) => s.setSearch);
  const openDeal = useUI((s) => s.openDeal);
  const router = useRouter();

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
      <div className="flex-1 overflow-auto p-6 max-w-[1400px] mx-auto w-full">
        {isLoading && <div className="text-fg-2 text-sm">Cargando…</div>}
        {!isLoading && (
          <div className="bg-bg-1 border border-border rounded-[14px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{lang === "es" ? "Empresa" : "Company"}</th>
                  <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_sector")}</th>
                  <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_city")}</th>
                  <th className="text-left py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{t("f_web")}</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">Deals</th>
                  <th className="text-right py-2.5 px-[14px] border-b border-border bg-bg-1 text-[10.5px] uppercase tracking-[0.1em] text-fg-2 font-semibold">{lang === "es" ? "Valor" : "Value"}</th>
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
                        "border-b border-border last:border-b-0",
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
                        {c.website ? <a href={`https://${c.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent"><Globe size={11} strokeWidth={1.5} />{c.website}</a> : "—"}
                      </td>
                      <td className="py-3 px-[14px] text-right text-fg-2 tabular">{own.length}</td>
                      <td className="py-3 px-[14px] text-right font-medium tabular">{fmtEuro(value, lang)}</td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr><td colSpan={6} className="py-10 text-center text-fg-2">{t("empty_title")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

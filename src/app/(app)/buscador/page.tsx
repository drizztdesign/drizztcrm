"use client";
import { useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { useCreateCompany, useCreateContact, useCompanies } from "@/lib/queries/contacts";
import { useCreateDeal } from "@/lib/queries/deals";
import type { LeadStage } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";
import { Search, Globe, Phone, Star, Plus, Check, Download, Loader2, Mail } from "lucide-react";

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  hasWeb: boolean;
  score: number;
  email?: string | null;
  emailLoading?: boolean;
}

const RADII = [1000, 3000, 5000, 10000, 20000];
const MAXRES = [10, 20, 40, 60];
const STATE_KEY = "drizzt-buscador-state-v1";

interface PersistedState {
  niche: string;
  location: string;
  radius: number;
  maxres: number;
  filterMode: "noweb" | "all";
  results: PlaceResult[];
  imported: Record<string, string>;
}

export default function BuscadorPage() {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const createCompany = useCreateCompany();
  const createContact = useCreateContact();
  const createDeal = useCreateDeal();
  const { data: companies = [] } = useCompanies();

  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("San Sebastián");
  const [radius, setRadius] = useState(3000);
  const [maxres, setMaxres] = useState(20);
  const [filterMode, setFilterMode] = useState<"noweb" | "all">("noweb");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [imported, setImported] = useState<Record<string, string>>({}); // place_id → deal_id
  const hydrated = useRef(false);

  // Hydrate from localStorage on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as PersistedState;
        if (s.niche) setNiche(s.niche);
        if (s.location) setLocation(s.location);
        if (s.radius) setRadius(s.radius);
        if (s.maxres) setMaxres(s.maxres);
        if (s.filterMode) setFilterMode(s.filterMode);
        if (Array.isArray(s.results)) setResults(s.results);
        if (s.imported) setImported(s.imported);
      }
    } catch {/* ignore corrupt state */}
    hydrated.current = true;
  }, []);

  // Persist whenever the relevant state changes (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    const s: PersistedState = { niche, location, radius, maxres, filterMode, results, imported };
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {/* quota */}
  }, [niche, location, radius, maxres, filterMode, results, imported]);

  const apiCall = async (action: string, params: Record<string, string | number>) => {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    const r = await fetch(`/api/maps?${qs}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
    return data;
  };

  const search = async () => {
    if (!niche.trim() || !location.trim()) {
      setError(lang === "es" ? "Escribe nicho y ciudad" : "Enter niche and city");
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    setImported({});

    try {
      const geo = await apiCall("geocode", { address: location });
      if (!geo.results?.length) throw new Error(lang === "es" ? "Ubicación no encontrada" : "Location not found");
      const { lat, lng } = geo.results[0].geometry.location;

      let places: { place_id: string; [k: string]: unknown }[] = [];
      let pageToken: string | null = null;
      const pagesNeeded = Math.ceil(maxres / 20);

      for (let pages = 0; places.length < maxres && pages < Math.min(pagesNeeded, 3); pages++) {
        let data: { status?: string; results?: typeof places; next_page_token?: string };
        if (pageToken) {
          await new Promise((r) => setTimeout(r, 2000));
          data = await apiCall("pagetoken", { pagetoken: pageToken });
        } else {
          data = await apiCall("nearbysearch", { lat, lng, radius, keyword: niche });
        }
        if (data.status === "REQUEST_DENIED") throw new Error("API key sin permisos. Activa Places + Geocoding.");
        if (data.status === "OVER_QUERY_LIMIT") throw new Error("Cuota agotada. Espera un momento.");
        if (data.results) places = places.concat(data.results);
        pageToken = data.next_page_token ?? null;
        if (!pageToken) break;
      }

      places = places.slice(0, maxres);

      const details = await Promise.all(
        places.map(async (p) => {
          try {
            const d = await apiCall("placedetails", { place_id: p.place_id });
            return { ...p, ...d.result };
          } catch {
            return p;
          }
        })
      );

      const out: PlaceResult[] = details
        .filter((p) => p.business_status !== "CLOSED_PERMANENTLY")
        .map((p) => {
          const hasWeb = !!p.website;
          const reviews = p.user_ratings_total ?? 0;
          const rating = p.rating ?? 0;
          const score = Math.round(
            (hasWeb ? 0 : 50) +
            Math.min(reviews / 5, 30) +
            (rating >= 4 ? 15 : rating >= 3 ? 8 : 0) +
            (p.formatted_phone_number ? 5 : 0)
          );
          return {
            place_id: p.place_id,
            name: p.name ?? "",
            address: p.formatted_address ?? p.vicinity ?? "",
            phone: p.formatted_phone_number ?? "",
            website: p.website ?? "",
            rating,
            reviews,
            hasWeb,
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

      setResults(out);
      // Kick off background email scraping for everyone with a website
      void scrapeAllEmails(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const buildScrapeUrl = (p: PlaceResult): string => {
    const params = new URLSearchParams();
    if (p.website) params.set("url", p.website);
    if (p.name) params.set("name", p.name);
    if (location) params.set("city", location);
    return `/api/scrape-email?${params}`;
  };

  const scrapeAllEmails = async (list: PlaceResult[]) => {
    // Scrape ALL businesses — those with web go through website parser first,
    // those without (or where parser failed) fall back to a search-engine query.
    setResults((prev) => prev.map((p) => (!p.email ? { ...p, emailLoading: true } : p)));
    // Lower concurrency for SERP fallback to be polite
    const queue = list.filter((p) => !p.email);
    const concurrency = 3;
    let idx = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (idx < queue.length) {
        const item = queue[idx++];
        try {
          const r = await fetch(buildScrapeUrl(item));
          const data = await r.json();
          const email = (data?.email as string | null) ?? null;
          setResults((prev) =>
            prev.map((p) => (p.place_id === item.place_id ? { ...p, email, emailLoading: false } : p))
          );
        } catch {
          setResults((prev) =>
            prev.map((p) => (p.place_id === item.place_id ? { ...p, email: null, emailLoading: false } : p))
          );
        }
      }
    });
    await Promise.all(workers);
  };

  const scrapeOne = async (placeId: string) => {
    const item = results.find((r) => r.place_id === placeId);
    if (!item) return;
    setResults((prev) =>
      prev.map((p) => (p.place_id === placeId ? { ...p, emailLoading: true } : p))
    );
    try {
      const r = await fetch(buildScrapeUrl(item));
      const data = await r.json();
      const email = (data?.email as string | null) ?? null;
      setResults((prev) =>
        prev.map((p) => (p.place_id === placeId ? { ...p, email, emailLoading: false } : p))
      );
      if (!email) show(lang === "es" ? "No se encontró email" : "No email found", "info");
    } catch {
      setResults((prev) =>
        prev.map((p) => (p.place_id === placeId ? { ...p, email: null, emailLoading: false } : p))
      );
    }
  };

  const importToCRM = async (p: PlaceResult) => {
    try {
      // Check if a company with same name already exists
      let companyId: string | null = companies.find((c) => c.name.toLowerCase() === p.name.toLowerCase())?.id ?? null;
      if (!companyId) {
        const c = await createCompany.mutateAsync({
          name: p.name,
          city: extractCity(p.address) || location,
          sector: niche,
          website: p.website || "",
          phone: p.phone || "",
          notes: `Importado del buscador · ⭐ ${p.rating || "—"} (${p.reviews || 0} reseñas)`,
        });
        companyId = c.id;
      }

      // Create a placeholder contact — uses scraped email if found
      const contact = await createContact.mutateAsync({
        name: p.name,
        company_id: companyId,
        phone: p.phone || "",
        email: p.email || "",
        role: "",
      });

      // Segment into prospecting stage based on available contact data
      const importStage: LeadStage = p.email
        ? "prospecto_email"
        : p.hasWeb
        ? "prospecto_web"
        : "prospecto_frio";

      // Create the deal
      const deal = await createDeal.mutateAsync({
        title: `${p.name} — ${niche}`,
        company_id: companyId,
        contact_id: contact.id,
        stage: importStage,
        source: "google",
        project_type: "landing",
        pain: p.hasWeb ? "web_antigua" : "no_web",
        temp: p.score >= 60 ? "warm" : "cold",
        score: Math.min(100, p.score),
        tags: ["Buscador", niche],
        notes: `Importado de Google Maps. ${p.rating ? `Rating ${p.rating}/5 (${p.reviews} reseñas).` : ""}`,
      });

      setImported((prev) => ({ ...prev, [p.place_id]: deal.id }));
      show(lang === "es" ? `${p.name} añadido al CRM` : `${p.name} added to CRM`, "ok");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const importAll = async () => {
    const pending = filtered.filter((p) => !imported[p.place_id]);
    if (pending.length === 0) return;
    if (!confirm(lang === "es" ? `¿Importar ${pending.length} negocios al CRM?` : `Import ${pending.length} businesses?`)) return;
    for (const p of pending) {
      await importToCRM(p);
    }
  };

  const exportCSV = () => {
    const headers = ["name", "address", "phone", "website", "rating", "reviews", "has_web", "score"];
    const rows = results.map((p) => [
      `"${p.name.replace(/"/g, "")}"`,
      `"${p.address.replace(/"/g, "")}"`,
      `"${p.phone}"`,
      `"${p.website}"`,
      p.rating || "",
      p.reviews || 0,
      p.hasWeb ? "Sí" : "No",
      p.score,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${niche.replace(/\s+/g, "-")}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noWeb = results.filter((r) => !r.hasWeb);
  const filtered = filterMode === "noweb" ? noWeb : results;

  return (
    <>
      <Topbar
        title={lang === "es" ? "Buscador de leads" : "Lead finder"}
        sub={lang === "es" ? "Encuentra negocios locales sin web" : "Find local businesses without a site"}
      />

      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[1100px] mx-auto w-full">
        {/* Search form */}
        <div className="bg-bg-1 border border-border rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.2fr_1fr_1fr] gap-3">
            <Field label={lang === "es" ? "Nicho de negocio" : "Business niche"}>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder={lang === "es" ? "fontaneros, peluquerías…" : "plumbers, hairdressers…"}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>
            <Field label={lang === "es" ? "Ciudad / zona" : "City / area"}>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>
            <Field label={lang === "es" ? "Radio" : "Radius"}>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                {RADII.map((r) => <option key={r} value={r}>{r >= 1000 ? `${r / 1000} km` : `${r} m`}</option>)}
              </select>
            </Field>
            <Field label={lang === "es" ? "Máx. resultados" : "Max results"}>
              <select
                value={maxres}
                onChange={(e) => setMaxres(parseInt(e.target.value))}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                {MAXRES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={search}
              disabled={loading || !niche.trim() || !location.trim()}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={1.8} />}
              {loading ? (lang === "es" ? "Buscando…" : "Searching…") : (lang === "es" ? "Buscar" : "Search")}
            </button>
            {error && <div className="text-[12.5px] text-danger">{error}</div>}
          </div>
        </div>

        {/* Results header */}
        {results.length > 0 && (
          <div className="bg-bg-1 border border-border rounded-xl p-4 mb-4 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-[14px] font-semibold">{niche} · {location}</div>
              <div className="text-[12px] text-fg-2">{results.length} {lang === "es" ? "analizados" : "analyzed"} · {noWeb.length} {lang === "es" ? "sin web" : "without site"}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterMode("noweb")}
                className={cn(
                  "px-2.5 py-1 text-[11.5px] rounded-md border",
                  filterMode === "noweb" ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border"
                )}
              >
                {lang === "es" ? "Sin web" : "No site"} ({noWeb.length})
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-2.5 py-1 text-[11.5px] rounded-md border",
                  filterMode === "all" ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border"
                )}
              >
                {lang === "es" ? "Todos" : "All"} ({results.length})
              </button>
              <button
                onClick={importAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] rounded-md bg-bg-2 border border-border hover:border-accent hover:text-accent"
              >
                <Plus size={12} />{lang === "es" ? "Importar todos" : "Import all"}
              </button>
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] rounded-md bg-bg-2 border border-border hover:border-border-strong"
              >
                <Download size={12} />CSV
              </button>
            </div>
          </div>
        )}

        {/* Results list */}
        <div className="bg-bg-1 border border-border rounded-xl divide-y divide-border">
          {loading && (
            <div className="p-8 text-center text-fg-2 text-sm">{lang === "es" ? "Consultando Google Maps…" : "Querying Google Maps…"}</div>
          )}
          {!loading && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="text-[56px] opacity-20">🗺️</div>
              <div className="text-[16px] font-semibold text-fg-1">
                {lang === "es" ? "Busca nuevos clientes potenciales" : "Find new potential clients"}
              </div>
              <div className="text-[13px] text-fg-2 max-w-[420px] leading-relaxed">
                {lang === "es"
                  ? "Introduce un nicho (ej: restaurantes, fontaneros, clínicas) y una ubicación para encontrar negocios locales sin presencia web y añadirlos como leads."
                  : "Enter a niche (e.g. restaurants, plumbers, clinics) and a location to find local businesses without a web presence and add them as leads."}
              </div>
              <div className="flex gap-2 text-[11.5px] text-fg-3">
                <span className="bg-bg-2 border border-border rounded-md px-2.5 py-1">🏗️ Reformas</span>
                <span className="bg-bg-2 border border-border rounded-md px-2.5 py-1">🍕 Restaurantes</span>
                <span className="bg-bg-2 border border-border rounded-md px-2.5 py-1">🦷 Clínicas dentales</span>
              </div>
            </div>
          )}
          {!loading && filtered.length === 0 && results.length > 0 && (
            <div className="p-8 text-center text-fg-2 text-sm">{lang === "es" ? "Sin resultados con este filtro" : "No results in this filter"}</div>
          )}
          {filtered.map((p) => {
            const isImported = !!imported[p.place_id];
            const scoreColor = p.score >= 60 ? "text-ok bg-ok/10" : p.score >= 35 ? "text-warn bg-warn/10" : "text-fg-2 bg-bg-3";
            return (
              <div key={p.place_id} className="p-3.5 flex items-start gap-3 group">
                <div className={cn("w-10 h-10 rounded-md grid place-items-center text-[12px] font-semibold shrink-0", scoreColor)}>
                  {p.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{p.name}</div>
                  <div className="text-[11.5px] text-fg-2 truncate">{p.address}</div>
                  <div className="flex flex-wrap gap-1.5 items-center mt-1.5 text-[11px]">
                    <span className={cn(
                      "rounded-md px-2 py-0.5 font-medium",
                      p.hasWeb ? "bg-bg-3 text-fg-2" : "bg-danger/15 text-danger"
                    )}>
                      {p.hasWeb ? (lang === "es" ? "Tiene web" : "Has site") : (lang === "es" ? "Sin web" : "No site")}
                    </span>
                    {p.phone && (
                      <span className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-1 inline-flex items-center gap-1">
                        <Phone size={10} strokeWidth={1.5} />{p.phone}
                      </span>
                    )}
                    {p.rating > 0 && (
                      <span className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-1 inline-flex items-center gap-1">
                        <Star size={10} strokeWidth={1.5} />{p.rating.toFixed(1)} ({p.reviews})
                      </span>
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-1 hover:text-accent inline-flex items-center gap-1 mono"
                      >
                        <Globe size={10} strokeWidth={1.5} />{lang === "es" ? "Ver web" : "Visit"}
                      </a>
                    )}
                    {p.email ? (
                      <a
                        href={`mailto:${p.email}`}
                        className="bg-accent-soft text-accent rounded-md px-2 py-0.5 inline-flex items-center gap-1 mono font-medium hover:brightness-110"
                      >
                        <Mail size={10} strokeWidth={1.8} />{p.email}
                      </a>
                    ) : p.emailLoading ? (
                      <span className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-3 inline-flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        {lang === "es" ? "buscando email…" : "finding email…"}
                      </span>
                    ) : (
                      <>
                        {p.website && (
                          <button
                            onClick={() => scrapeOne(p.place_id)}
                            className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-3 hover:text-accent inline-flex items-center gap-1"
                            title={lang === "es" ? "Reintentar scraping de la web" : "Retry website scraping"}
                          >
                            <Mail size={10} strokeWidth={1.5} />
                            {lang === "es" ? "reintentar" : "retry"}
                          </button>
                        )}
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`"${p.name}" ${location} email contacto`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-bg-3 rounded-md px-2 py-0.5 text-fg-3 hover:text-accent inline-flex items-center gap-1"
                          title={lang === "es" ? "Buscar email en Google" : "Search email on Google"}
                        >
                          <Search size={10} strokeWidth={1.5} />
                          Google
                        </a>
                      </>
                    )}
                  </div>
                </div>
                {isImported ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-accent-soft text-accent rounded-md shrink-0">
                    <Check size={12} strokeWidth={2} />
                    {lang === "es" ? "Importado" : "Imported"}
                  </span>
                ) : (
                  <button
                    onClick={() => importToCRM(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-accent text-accent-ink font-semibold rounded-md hover:brightness-105 shrink-0"
                  >
                    <Plus size={12} strokeWidth={2} />
                    {lang === "es" ? "Importar" : "Import"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em]">{label}</span>
      {children}
    </label>
  );
}

function extractCity(address: string): string {
  // Naive: take the second-to-last comma chunk (Spanish-style "Calle X, 12, Donostia, 20003 Spain")
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2].replace(/^\d+\s*/, "");
  return parts[0] ?? "";
}

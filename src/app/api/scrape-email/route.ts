import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Find a contact email for a business.
 *
 * Two modes:
 *   A) ?url=https://negocio.com → scrape that website (homepage + common contact pages)
 *   B) ?name=Foo&city=Bar     → no website, fallback to a web search engine
 *      and parse the result snippets for emails
 *
 * Returns first viable email or null.
 */
export async function GET(request: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const name = searchParams.get("name");
  const city = searchParams.get("city");

  // Mode A: scrape website
  if (rawUrl) {
    const email = await scrapeWebsite(rawUrl);
    if (email) return NextResponse.json({ email, source: "website" });
    // If website scrape fails AND we have a name, fall through to search engine
    if (name) {
      const e = await searchEngineFallback(name, city ?? "");
      if (e) return NextResponse.json({ email: e, source: "search" });
    }
    return NextResponse.json({ email: null });
  }

  // Mode B: no website — go straight to search engines
  if (name) {
    const email = await searchEngineFallback(name, city ?? "");
    return NextResponse.json({ email, source: email ? "search" : null });
  }

  return NextResponse.json({ error: "url or name required" }, { status: 400 });
}

async function scrapeWebsite(rawUrl: string): Promise<string | null> {
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return null;
  }

  const candidates = [
    baseUrl.toString(),
    new URL("/contacto", baseUrl).toString(),
    new URL("/contact", baseUrl).toString(),
    new URL("/contacto/", baseUrl).toString(),
    new URL("/about", baseUrl).toString(),
    new URL("/sobre-nosotros", baseUrl).toString(),
    new URL("/quienes-somos", baseUrl).toString(),
  ];

  for (const url of candidates) {
    const html = await fetchHtml(url, 6000);
    if (!html) continue;
    const email = extractEmail(html);
    if (email) return email;
  }
  return null;
}

/**
 * Last-resort search: DuckDuckGo HTML interface (no API key, no JS required).
 * For each candidate query we fetch the SERP and look for emails in the snippets.
 *
 * We try a few query variants because Spanish small businesses are scattered
 * across directories (PaginasAmarillas, 11870, Yelp, Facebook, Instagram).
 */
async function searchEngineFallback(name: string, city: string): Promise<string | null> {
  const cleanName = name.replace(/[^\w\s\-áéíóúñü&.,']/gi, "").trim();
  if (!cleanName) return null;

  const queries = [
    `"${cleanName}" ${city} email`,
    `"${cleanName}" ${city} contacto`,
    `"${cleanName}" ${city} info@ OR contacto@`,
    `"${cleanName}" ${city} site:facebook.com email`,
    `"${cleanName}" ${city} site:instagram.com email`,
  ];

  for (const q of queries) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const html = await fetchHtml(url, 8000);
    if (!html) continue;
    const email = extractEmailFromSerp(html);
    if (email) return email;
  }
  return null;
}

async function fetchHtml(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    return await r.text();
  } catch {
    return null;
  }
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const MAILTO_RE = /href\s*=\s*["']mailto:([^"'?]+)["'?]/gi;

const BAD_DOMAINS = new Set([
  "sentry.io",
  "wixpress.com",
  "wix.com",
  "godaddy.com",
  "wordpress.com",
  "squarespace.com",
  "example.com",
  "domain.com",
  "yourdomain.com",
  "tudominio.com",
  "sentry-next.wixpress.com",
  // SERP / directory tracking & noise
  "duckduckgo.com",
  "duck.com",
  "google.com",
  "googlemail.com",
  "googleapis.com",
  "gstatic.com",
  "doubleclick.net",
  "facebook.com",
  "fbcdn.net",
  "instagram.com",
  "twitter.com",
  "x.com",
  "pinterest.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "yelp.com",
  "yelp.es",
  "tripadvisor.com",
  "tripadvisor.es",
  "paginasamarillas.es",
  "paginas-amarillas.es",
  "11870.com",
]);

const BAD_LOCAL = ["no-reply", "noreply", "donotreply", "wixsite", "test", "example", "u003e", "u003c"];

function isViableEmail(addr: string): boolean {
  const lower = addr.toLowerCase().trim();
  if (lower.length > 80) return false;
  if (/\.(png|jpe?g|gif|svg|webp|woff2?|ttf|otf|css|js|map)(\?|$)/i.test(lower)) return false;
  const [local, domain] = lower.split("@");
  if (!local || !domain) return false;
  if (BAD_DOMAINS.has(domain)) return false;
  for (const bad of BAD_LOCAL) if (local.includes(bad)) return false;
  if (/^[a-f0-9]{16,}$/i.test(local)) return false;
  return true;
}

function extractEmail(html: string): string | null {
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  MAILTO_RE.lastIndex = 0;
  while ((m = MAILTO_RE.exec(html))) {
    const decoded = decodeURIComponent(m[1].split("?")[0]);
    if (isViableEmail(decoded)) return decoded.toLowerCase();
    seen.add(decoded.toLowerCase());
  }
  EMAIL_RE.lastIndex = 0;
  const all: string[] = [];
  while ((m = EMAIL_RE.exec(html))) {
    const e = m[0].toLowerCase();
    if (!seen.has(e) && isViableEmail(e)) all.push(e);
  }
  if (all.length === 0) return null;
  const preferred = all.find((e) => /^(info|contacto|contact|hola|hello|admin|hi|reservas|bookings)@/.test(e));
  return preferred ?? all[0];
}

/**
 * SERP-specific extraction: count email occurrences and pick the most frequent
 * one. The first email match in DuckDuckGo HTML is often a noisy hidden anchor;
 * a real business email tends to appear multiple times across snippets.
 */
function extractEmailFromSerp(html: string): string | null {
  EMAIL_RE.lastIndex = 0;
  const counts = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = EMAIL_RE.exec(html))) {
    const e = m[0].toLowerCase();
    if (!isViableEmail(e)) continue;
    counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  // Sort by count desc, then prefer info@/contacto@
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([email]) => email);
  const preferred = sorted.find((e) =>
    /^(info|contacto|contact|hola|hello|admin|hi|reservas|bookings)@/.test(e)
  );
  return preferred ?? sorted[0];
}

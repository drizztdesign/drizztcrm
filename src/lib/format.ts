import { formatDistanceToNowStrict, format, parseISO, isValid } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Lang } from "@/lib/supabase/types";

export function fmtEuro(n: number | null | undefined, lang: Lang = "es"): string {
  if (n == null || Number.isNaN(n)) return "—";
  const locale = lang === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtNumK(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".0", "") + "K";
  return String(n);
}

export function fmtPct(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtDate(iso: string | null | undefined, lang: Lang = "es"): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return iso as string;
  return format(d, "d LLL yyyy", { locale: lang === "es" ? es : enUS });
}

export function fmtDateShort(iso: string | null | undefined, lang: Lang = "es"): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return iso as string;
  return format(d, "d LLL", { locale: lang === "es" ? es : enUS });
}

export function fmtRelative(iso: string | null | undefined, lang: Lang = "es"): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return iso as string;
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: lang === "es" ? es : enUS });
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const ta = typeof a === "string" ? new Date(a).getTime() : a.getTime();
  const tb = typeof b === "string" ? new Date(b).getTime() : b.getTime();
  return Math.round((tb - ta) / 86_400_000);
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function avatarGradient(seed: string): string {
  const grads = [
    "linear-gradient(135deg,#ff8a47,#ff5a47)",
    "linear-gradient(135deg,#6aa7ff,#4a6cff)",
    "linear-gradient(135deg,#b288ff,#8b6dff)",
    "linear-gradient(135deg,#4ac38a,#2fa068)",
    "linear-gradient(135deg,#f5b544,#ed8c28)",
    "linear-gradient(135deg,#e77fc1,#c84a9e)",
    "linear-gradient(135deg,#5ec7d0,#3a9aa8)",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return grads[Math.abs(h) % grads.length];
}

export function mailtoLink(to: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${to}${qs ? "?" + qs : ""}`;
}

export function whatsappLink(phone: string, text?: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}${params}`;
}

export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

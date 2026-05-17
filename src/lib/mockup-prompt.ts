import type { DealWithRelations } from "@/lib/supabase/types";
import { PAIN_META } from "@/lib/domain";

export function buildMockupPrompt(deal: DealWithRelations, lang: "es" | "en" = "es"): string {
  const c = deal.company;
  const k = deal.contact;
  const painLabel = lang === "es" ? PAIN_META[deal.pain]?.labelEs : PAIN_META[deal.pain]?.labelEn;

  const data = [
    `- Empresa: ${c?.name ?? deal.title}`,
    c?.sector ? `- Sector: ${c.sector}` : null,
    c?.city ? `- Ciudad: ${c.city}` : null,
    c?.website ? `- Web actual: ${c.website}` : "- Web actual: ninguna",
    k?.email ? `- Email: ${k.email}` : null,
    k?.phone || c?.phone ? `- Teléfono: ${k?.phone ?? c?.phone}` : null,
    painLabel ? `- Pain detectado: ${painLabel}` : null,
    deal.notes ? `- Notas: ${deal.notes.slice(0, 280)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Usa la skill **crear-web-premium** para generar un MOCKUP de landing premium de UNA SOLA PÁGINA.

## Datos del cliente
${data}

## Instrucciones especiales (modo mockup CRM)
- Solo UN archivo: \`index.html\` con todo el CSS embebido en \`<style>\`
- NO multi-página. NO scroll-video real. NO ffmpeg. NO assets externos al HTML.
- Hero con imagen de fondo: usa \`https://picsum.photos/seed/${c?.name?.replace(/\s+/g, "") ?? "drizzt"}/1920/1080\`
- Imágenes de servicios/sobre: usa \`https://picsum.photos/seed/N/...\` con seeds distintos
- Tipografía: **Cormorant Garamond** (display) + **Nunito** (body) vía Google Fonts CDN
- Paleta: deduce 2-3 colores apropiados para el sector indicado arriba
- Secciones obligatorias (en este orden):
  1. **Hero** — nombre de la empresa como h1, subtítulo conectado al pain detectado, CTA "Hablemos"
  2. **Problema** — 3 puntos de dolor típicos del sector
  3. **Servicios** — 3 cards de servicios que resuelven el problema
  4. **Sobre** — bloque corto con foto + texto sobre el enfoque
  5. **CTA grande** — frase potente + botón
  6. **Contacto** — datos reales del cliente (email/teléfono) + form (no funcional)
- Mobile-first, sin frameworks
- Idioma del HTML: español
- Estilo: editorial, generoso en espacio (padding 80-100px en secciones), tipografía grande, premium

## Output
Cuando termines, copia TODO el contenido de \`index.html\` (desde \`<!DOCTYPE html>\` hasta \`</html>\`) y pégalo en el textarea del CRM. No hace falta deploy ni assets aparte.`;
}

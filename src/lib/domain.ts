// Reglas de dominio del CRM — cálculos puros sin dependencia de Supabase.
import type {
  Deal,
  DealWithRelations,
  LeadStage,
  LeadTemp,
  LeadSource,
  ProjectType,
  PainKey,
} from "@/lib/supabase/types";

export const STAGE_ORDER: LeadStage[] = [
  "prospecto_frio",
  "prospecto_web",
  "prospecto_email",
  "lead",
  "contactado",
  "interesado",
  "reunion",
  "propuesta",
  "negociacion",
  "cerrado",
];

export const ACTIVE_STAGES: LeadStage[] = [
  "lead",
  "contactado",
  "interesado",
  "reunion",
  "propuesta",
  "negociacion",
  "cerrado",
];

export const PROSPECTING_STAGES: LeadStage[] = [
  "prospecto_frio",
  "prospecto_web",
  "prospecto_email",
];

export const STAGE_META: Record<LeadStage, {
  labelEs: string;
  labelEn: string;
  prob: number;
  hintEs: string;
  hintEn: string;
}> = {
  prospecto_email: { labelEs: "Con email",  labelEn: "Has email",    prob: 5, hintEs: "Importado con email — listo para contactar", hintEn: "Imported with email — ready to contact" },
  prospecto_web:   { labelEs: "Sin email",  labelEn: "No email",     prob: 3, hintEs: "Tiene web pero sin email encontrado",        hintEn: "Has website but no email found" },
  prospecto_frio:  { labelEs: "Sin web",    labelEn: "No website",   prob: 2, hintEs: "Sin web ni email — contacto frío",           hintEn: "No website or email — cold contact" },
  lead:        { labelEs: "Lead",        labelEn: "Lead",       prob: 10,  hintEs: "Captados, sin contactar",       hintEn: "Captured, uncontacted" },
  contactado:  { labelEs: "Contactado",  labelEn: "Contacted",  prob: 20,  hintEs: "Primer mensaje enviado",        hintEn: "First message sent" },
  interesado:  { labelEs: "Interesado",  labelEn: "Interested", prob: 35,  hintEs: "Respondió con interés",          hintEn: "Responded with interest" },
  reunion:     { labelEs: "Reunión",     labelEn: "Meeting",    prob: 50,  hintEs: "Call agendada o hecha",          hintEn: "Call scheduled or done" },
  propuesta:   { labelEs: "Propuesta",   labelEn: "Proposal",   prob: 70,  hintEs: "Presupuesto enviado",            hintEn: "Proposal sent" },
  negociacion: { labelEs: "Negociación", labelEn: "Negotiation",prob: 85,  hintEs: "Ajustando términos",             hintEn: "Adjusting terms" },
  cerrado:     { labelEs: "Cerrado",     labelEn: "Closed won", prob: 100, hintEs: "Venta ganada",                   hintEn: "Deal won" },
  lost:        { labelEs: "Perdido",     labelEn: "Lost",       prob: 0,   hintEs: "Oportunidad perdida",            hintEn: "Opportunity lost" },
};

export const TEMP_META: Record<LeadTemp, { labelEs: string; labelEn: string; className: string }> = {
  superhot: { labelEs: "Muy caliente", labelEn: "Very hot", className: "dot-superhot" },
  hot:      { labelEs: "Caliente",     labelEn: "Hot",      className: "dot-hot" },
  warm:     { labelEs: "Templado",     labelEn: "Warm",     className: "dot-warm" },
  cold:     { labelEs: "Frío",         labelEn: "Cold",     className: "dot-cold" },
  lost:     { labelEs: "Perdido",      labelEn: "Lost",     className: "dot-lost" },
};

export const SOURCE_META: Record<LeadSource, { labelEs: string; labelEn: string; icon: string }> = {
  web:         { labelEs: "Web",             labelEn: "Website",    icon: "🌐" },
  instagram:   { labelEs: "Instagram",       labelEn: "Instagram",  icon: "📸" },
  referido:    { labelEs: "Referido",        labelEn: "Referral",   icon: "🤝" },
  google:      { labelEs: "Google",          labelEn: "Google",     icon: "🔍" },
  email_frio:  { labelEs: "Email frío",      labelEn: "Cold email", icon: "📧" },
  llamada:     { labelEs: "Llamada",         labelEn: "Call",       icon: "📞" },
  networking:  { labelEs: "Networking",      labelEn: "Networking", icon: "🎯" },
  cliente_ant: { labelEs: "Cliente anterior",labelEn: "Past client",icon: "⭐" },
  linkedin:    { labelEs: "LinkedIn",        labelEn: "LinkedIn",   icon: "💼" },
};

export const PROJECT_META: Record<ProjectType, { labelEs: string; labelEn: string; color: string }> = {
  landing:      { labelEs: "Landing page",    labelEn: "Landing page",   color: "#5ec7d0" },
  corporativa:  { labelEs: "Web corporativa", labelEn: "Corporate site", color: "#6aa7ff" },
  premium:      { labelEs: "Web premium",     labelEn: "Premium site",   color: "#b288ff" },
  redisenio:    { labelEs: "Rediseño web",    labelEn: "Redesign",       color: "#f5b544" },
  ecommerce:    { labelEs: "E-commerce",      labelEn: "E-commerce",     color: "#ff7a59" },
  mantenimiento:{ labelEs: "Mantenimiento",   labelEn: "Maintenance",    color: "#4ac38a" },
  seo:          { labelEs: "SEO",             labelEn: "SEO",            color: "#e77fc1" },
  ia:           { labelEs: "Automatización IA", labelEn: "AI automation",color: "#a995ff" },
};

export const PAIN_META: Record<PainKey, { labelEs: string; labelEn: string }> = {
  no_web:       { labelEs: "No tiene web", labelEn: "No website" },
  web_antigua:  { labelEs: "Su web parece antigua", labelEn: "Outdated website" },
  no_contactos: { labelEs: "No recibe contactos", labelEn: "No leads coming in" },
  no_confianza: { labelEs: "No transmite confianza", labelEn: "No credibility" },
  no_google:    { labelEs: "No aparece en Google", labelEn: "Not on Google" },
  mala_imagen:  { labelEs: "Mala imagen vs competencia", labelEn: "Bad vs competitors" },
  vender_mas:   { labelEs: "Quiere vender más", labelEn: "Wants more sales" },
  automatizar:  { labelEs: "Quiere automatizar", labelEn: "Wants automation" },
};

export function probabilityFor(deal: Pick<Deal, "stage" | "prob_override">): number {
  if (deal.prob_override != null) return deal.prob_override / 100;
  return STAGE_META[deal.stage].prob / 100;
}

export function dealValue(deal: Pick<Deal, "price_offered" | "price_closed" | "price_estimated">): number {
  return deal.price_closed ?? deal.price_offered ?? deal.price_estimated ?? 0;
}

export function weightedValue(deal: Pick<Deal, "stage" | "prob_override" | "price_offered" | "price_closed" | "price_estimated">): number {
  return dealValue(deal) * probabilityFor(deal);
}

export function pipelineTotals(deals: DealWithRelations[] | Deal[]) {
  const active = (deals as Deal[]).filter((d) =>
    d.stage !== "lost" && d.stage !== "cerrado" && !PROSPECTING_STAGES.includes(d.stage)
  );
  const total = active.reduce((a, d) => a + dealValue(d), 0);
  const weighted = active.reduce((a, d) => a + weightedValue(d), 0);
  const closedDeals = (deals as Deal[]).filter((d) => d.stage === "cerrado");
  const closedValue = closedDeals.reduce((a, d) => a + (d.price_closed ?? d.price_offered ?? 0), 0);
  const conversion = deals.length > 0 ? closedDeals.length / (deals.length - active.filter(d => d.stage === "lead").length || 1) : 0;
  return { total, weighted, closedValue, count: active.length, closedCount: closedDeals.length, conversion };
}

export function groupByStage(deals: DealWithRelations[]): Record<LeadStage, DealWithRelations[]> {
  const out: Record<string, DealWithRelations[]> = {};
  for (const s of STAGE_ORDER) out[s] = [];
  for (const d of deals) {
    if (d.stage === "lost") continue;
    (out[d.stage] ??= []).push(d);
  }
  return out as Record<LeadStage, DealWithRelations[]>;
}

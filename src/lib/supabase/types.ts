// Tipos de dominio — reflejan las columnas de la BBDD.
// Los enums son equivalentes en TS a los del Postgres.

export type LeadStage = "lead" | "contactado" | "interesado" | "reunion" | "propuesta" | "negociacion" | "cerrado" | "lost";
export type PostStage = "desarrollo" | "revision" | "entregada" | "mantenimiento" | "finalizado" | "recurrente";
export type LeadTemp = "superhot" | "hot" | "warm" | "cold" | "lost";
export type PayState = "pendiente" | "senal" | "parcial" | "pagado" | "impagado";
export type LeadSource = "web" | "instagram" | "referido" | "google" | "email_frio" | "llamada" | "networking" | "cliente_ant" | "linkedin";
export type ProjectType = "landing" | "corporativa" | "premium" | "redisenio" | "ecommerce" | "mantenimiento" | "seo" | "ia";
export type NextActionStatus = "urgent" | "ok" | "missing" | "none";
export type LossReason = "precio" | "no_responde" | "proveedor" | "no_prio" | "aplazado" | "no_encaja" | "presupuesto" | "otro";
export type PainKey = "no_web" | "web_antigua" | "no_contactos" | "no_confianza" | "no_google" | "mala_imagen" | "vender_mas" | "automatizar";
export type TimelineKind = "whatsapp" | "email" | "note" | "meeting" | "proposal" | "linkedin" | "dm" | "form" | "call" | "payment";
export type TaskKind = "call" | "whatsapp" | "email" | "meeting" | "note" | "proposal" | "payment";
export type TemplateChannel = "whatsapp" | "email" | "instagram" | "linkedin";
export type TaskPriority = "urgent" | "high" | "normal" | "low";
export type ProposalStatus = "draft" | "sent" | "signed" | "rejected";
export type ProposalPackage = "esencial" | "profesional" | "premium";
export type Lang = "es" | "en";

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  website: string;
  sector: string;
  city: string;
  phone: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  company_id: string | null;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  owner_id: string;
  code: string;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  stage: LeadStage;
  post_stage: PostStage | null;
  temp: LeadTemp;
  score: number;
  prob_override: number | null;
  price_estimated: number;
  price_offered: number | null;
  price_closed: number | null;
  cost_estimated: number;
  pay_state: PayState;
  source: LeadSource;
  project_type: ProjectType;
  pain: PainKey;
  problems: string[];
  notes: string;
  entered_at: string;
  first_contact_at: string | null;
  last_touch: string;
  stage_entered_at: string;
  lost_reason: LossReason | null;
  lost_at: string | null;
  next_action: string | null;
  next_action_date: string | null;
  next_action_channel: string | null;
  next_action_status: NextActionStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  company: Company | null;
  contact: Contact | null;
}

export interface TimelineEvent {
  id: string;
  owner_id: string;
  deal_id: string | null;
  contact_id: string | null;
  t: string;
  occurred_at: string;
  kind: TimelineKind;
  who: string;
  body: string;
  created_at: string;
}

export interface Task {
  id: string;
  owner_id: string;
  deal_id: string | null;
  contact_id: string | null;
  title: string;
  kind: TaskKind;
  due: string;
  due_at: string | null;
  done: boolean;
  done_at: string | null;
  priority: TaskPriority;
  created_at: string;
}

export interface Template {
  id: string;
  owner_id: string;
  stage: string;
  channel: TemplateChannel;
  lang: Lang;
  title: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  owner_id: string;
  name: string;
  description_es: string;
  description_en: string;
  icon: string;
  enabled: boolean;
  trigger: Record<string, unknown>;
  action: Record<string, unknown>;
  stats: { fires: number; lastFiredAt?: string | null };
  last_run_at?: string | null;
  created_at: string;
}

export interface ScoringRule {
  id: string;
  owner_id: string;
  name: string;
  description_es: string;
  description_en: string;
  weight: number;
  enabled: boolean;
  predicate: Record<string, unknown>;
  created_at: string;
}

export interface Proposal {
  id: string;
  owner_id: string;
  deal_id: string;
  package_key: ProposalPackage;
  title: string;
  items: { label: string; value?: string }[];
  subtotal: number;
  tax: number;
  grand_total: number;
  status: ProposalStatus;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

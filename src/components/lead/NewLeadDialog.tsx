"use client";
import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateDeal } from "@/lib/queries/deals";
import { useCreateCompany, useCreateContact, useCompanies, useContacts } from "@/lib/queries/contacts";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { STAGE_ORDER, STAGE_META, SOURCE_META, PROJECT_META } from "@/lib/domain";
import type { LeadStage, LeadSource, ProjectType } from "@/lib/supabase/types";

export function NewLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const create = useCreateDeal();
  const createCompany = useCreateCompany();
  const createContact = useCreateContact();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const show = useUI((s) => s.showToast);
  const openDeal = useUI((s) => s.openDeal);

  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<LeadStage>("lead");
  const [source, setSource] = useState<LeadSource>("web");
  const [project, setProject] = useState<ProjectType>("landing");
  const [price, setPrice] = useState("");

  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [companySector, setCompanySector] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyWeb, setCompanyWeb] = useState("");

  const [contactId, setContactId] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");

  const [showCompany, setShowCompany] = useState(false);
  const [showContact, setShowContact] = useState(false);

  if (!open) return null;

  const reset = () => {
    setTitle(""); setPrice("");
    setCompanyId(""); setCompanyName(""); setCompanySector(""); setCompanyCity(""); setCompanyWeb("");
    setContactId(""); setContactName(""); setContactEmail(""); setContactPhone(""); setContactRole("");
    setShowCompany(false); setShowContact(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      let resolvedCompanyId: string | null = companyId || null;
      if (!resolvedCompanyId && companyName.trim()) {
        const c = await createCompany.mutateAsync({
          name: companyName.trim(),
          sector: companySector.trim(),
          city: companyCity.trim(),
          website: companyWeb.trim(),
        });
        resolvedCompanyId = c.id;
      }

      let resolvedContactId: string | null = contactId || null;
      if (!resolvedContactId && contactName.trim()) {
        const c = await createContact.mutateAsync({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          role: contactRole.trim(),
          company_id: resolvedCompanyId,
        });
        resolvedContactId = c.id;
      }

      const deal = await create.mutateAsync({
        title: title.trim(),
        stage,
        source,
        project_type: project,
        price_estimated: parseInt(price) || 0,
        company_id: resolvedCompanyId,
        contact_id: resolvedContactId,
      });

      show(lang === "es" ? "Lead creado" : "Lead created", "ok");
      reset();
      onClose();
      if (deal?.id) openDeal(deal.id);
    } catch (err) {
      show(err instanceof Error ? err.message : "Error", "error");
    }
  };

  const isPending = create.isPending || createCompany.isPending || createContact.isPending;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 backdrop-enter"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[92vw] max-h-[90vh] bg-bg-1 border border-border rounded-2xl z-50 drawer-enter shadow-pop flex flex-col">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border shrink-0">
          <h2 className="m-0 text-[16px] font-semibold">{t("new_lead")}</h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto p-[18px_22px] flex flex-col gap-3.5 flex-1">
            <Field label={lang === "es" ? "Título / proyecto" : "Title / project"}>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={lang === "es" ? "Ej: Web restaurante Bilbao" : "e.g. Bilbao restaurant site"}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={lang === "es" ? "Etapa" : "Stage"}>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as LeadStage)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  {STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {lang === "es" ? STAGE_META[s].labelEs : STAGE_META[s].labelEn}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={lang === "es" ? "Origen" : "Source"}>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  {(Object.keys(SOURCE_META) as LeadSource[]).map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_META[s].icon} {lang === "es" ? SOURCE_META[s].labelEs : SOURCE_META[s].labelEn}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={lang === "es" ? "Tipo" : "Type"}>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value as ProjectType)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  {(Object.keys(PROJECT_META) as ProjectType[]).map((p) => (
                    <option key={p} value={p}>
                      {lang === "es" ? PROJECT_META[p].labelEs : PROJECT_META[p].labelEn}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={lang === "es" ? "Presupuesto (€)" : "Budget (€)"}>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min={0}
                  placeholder="3500"
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full tabular"
                />
              </Field>
            </div>

            <Section
              label={lang === "es" ? "Empresa (opcional)" : "Company (optional)"}
              open={showCompany}
              onToggle={() => setShowCompany((v) => !v)}
            >
              <Field label={lang === "es" ? "Empresa existente" : "Existing company"}>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  <option value="">{lang === "es" ? "— Crear nueva —" : "— Create new —"}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              {!companyId && (
                <>
                  <Field label={lang === "es" ? "Nombre" : "Name"}>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={lang === "es" ? "Acme S.L." : "Acme Inc."}
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={lang === "es" ? "Sector" : "Sector"}>
                      <input
                        value={companySector}
                        onChange={(e) => setCompanySector(e.target.value)}
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                      />
                    </Field>
                    <Field label={lang === "es" ? "Ciudad" : "City"}>
                      <input
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                      />
                    </Field>
                  </div>
                  <Field label={lang === "es" ? "Web" : "Website"}>
                    <input
                      value={companyWeb}
                      onChange={(e) => setCompanyWeb(e.target.value)}
                      placeholder="acme.com"
                      className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
                    />
                  </Field>
                </>
              )}
            </Section>

            <Section
              label={lang === "es" ? "Contacto (opcional)" : "Contact (optional)"}
              open={showContact}
              onToggle={() => setShowContact((v) => !v)}
            >
              <Field label={lang === "es" ? "Contacto existente" : "Existing contact"}>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                >
                  <option value="">{lang === "es" ? "— Crear nuevo —" : "— Create new —"}</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company?.name ? ` · ${c.company.name}` : ""}</option>
                  ))}
                </select>
              </Field>
              {!contactId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={lang === "es" ? "Nombre" : "Name"}>
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={lang === "es" ? "María Pérez" : "Mary Jones"}
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                      />
                    </Field>
                    <Field label={lang === "es" ? "Cargo" : "Role"}>
                      <input
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        placeholder={lang === "es" ? "CEO, Marketing, …" : "CEO, Marketing, …"}
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={lang === "es" ? "Email" : "Email"}>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
                      />
                    </Field>
                    <Field label={lang === "es" ? "Teléfono" : "Phone"}>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
                      />
                    </Field>
                  </div>
                </>
              )}
            </Section>
          </div>

          <div className="flex gap-2 p-[14px_22px] border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border bg-bg-2 text-[13px] font-medium hover:border-border-strong"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
            >
              {isPending ? (lang === "es" ? "Creando…" : "Creating…") : (lang === "es" ? "Crear lead" : "Create lead")}
            </button>
          </div>
        </form>
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

function Section({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-2 hover:bg-bg-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-2"
      >
        {label}
        {open ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
      </button>
      {open && <div className="p-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

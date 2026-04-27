"use client";
import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useUpdateContact, useDeleteContact, useCompanies } from "@/lib/queries/contacts";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import type { Contact, Company } from "@/lib/supabase/types";

export function EditContactDialog({
  contact,
  onClose,
}: {
  contact: (Contact & { company?: Company | null }) | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const update = useUpdateContact();
  const del = useDeleteContact();
  const show = useUI((s) => s.showToast);
  const { data: companies = [] } = useCompanies();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRole(contact.role ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
      setCompanyId(contact.company_id ?? "");
      setConfirming(false);
    }
  }, [contact]);

  if (!contact) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      {
        id: contact.id,
        patch: {
          name: name.trim(),
          role: role.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company_id: companyId || null,
        },
      },
      {
        onSuccess: () => {
          show(lang === "es" ? "Contacto actualizado" : "Contact updated", "ok");
          onClose();
        },
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
      }
    );
  };

  const onDelete = () => {
    del.mutate(contact.id, {
      onSuccess: () => {
        show(lang === "es" ? "Contacto eliminado" : "Contact deleted", "ok");
        onClose();
      },
      onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 backdrop-enter"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[92vw] bg-bg-1 border border-border rounded-2xl z-50 drawer-enter shadow-pop">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border">
          <h2 className="m-0 text-[16px] font-semibold">
            {lang === "es" ? "Editar contacto" : "Edit contact"}
          </h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={submit} className="p-[18px_22px] flex flex-col gap-3.5">
          <Field label={lang === "es" ? "Nombre" : "Name"}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "es" ? "Cargo" : "Role"}>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>
            <Field label={lang === "es" ? "Empresa" : "Company"}>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                <option value="">— {lang === "es" ? "Ninguna" : "None"} —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
              />
            </Field>
            <Field label={lang === "es" ? "Teléfono" : "Phone"}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full mono"
              />
            </Field>
          </div>

          {confirming ? (
            <div className="border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
              <div className="text-[12.5px] text-fg-1">
                {lang === "es"
                  ? "¿Eliminar este contacto definitivamente?"
                  : "Delete this contact permanently?"}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={del.isPending}
                  className="flex-1 h-9 rounded-md bg-danger text-white text-[12.5px] font-semibold disabled:opacity-60"
                >
                  {lang === "es" ? "Sí, borrar" : "Yes, delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="h-10 px-3 rounded-lg border border-border bg-bg-2 text-fg-2 hover:border-danger hover:text-danger"
                title={lang === "es" ? "Borrar" : "Delete"}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border bg-bg-2 text-[13px] font-medium hover:border-border-strong"
              >
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || update.isPending}
                className="flex-1 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
              >
                {update.isPending
                  ? lang === "es"
                    ? "Guardando…"
                    : "Saving…"
                  : lang === "es"
                  ? "Guardar"
                  : "Save"}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em]">
        {label}
      </span>
      {children}
    </label>
  );
}

"use client";
import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useUpdateCompany, useDeleteCompany } from "@/lib/queries/contacts";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import type { Company } from "@/lib/supabase/types";

export function EditCompanyDialog({
  company,
  onClose,
}: {
  company: Company | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const update = useUpdateCompany();
  const del = useDeleteCompany();
  const show = useUI((s) => s.showToast);

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setSector(company.sector ?? "");
      setCity(company.city ?? "");
      setWebsite(company.website ?? "");
      setPhone(company.phone ?? "");
      setNotes(company.notes ?? "");
      setConfirming(false);
    }
  }, [company]);

  if (!company) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      {
        id: company.id,
        patch: {
          name: name.trim(),
          sector: sector.trim(),
          city: city.trim(),
          website: website.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          show(lang === "es" ? "Empresa actualizada" : "Company updated", "ok");
          onClose();
        },
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
      }
    );
  };

  const onDelete = () => {
    del.mutate(company.id, {
      onSuccess: () => {
        show(lang === "es" ? "Empresa eliminada" : "Company deleted", "ok");
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] bg-bg-1 border border-border rounded-2xl z-50 drawer-enter shadow-pop">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border">
          <h2 className="m-0 text-[16px] font-semibold">
            {lang === "es" ? "Editar empresa" : "Edit company"}
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
            <Field label={lang === "es" ? "Sector" : "Sector"}>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>
            <Field label={lang === "es" ? "Ciudad" : "City"}>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "es" ? "Web" : "Website"}>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="acme.com"
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

          <Field label={lang === "es" ? "Notas" : "Notes"}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg bg-bg-2 border border-border px-3 py-2 text-[13.5px] outline-none focus:border-accent w-full resize-y"
            />
          </Field>

          {confirming ? (
            <div className="border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
              <div className="text-[12.5px] text-fg-1">
                {lang === "es"
                  ? "¿Eliminar esta empresa? Sus contactos quedarán sin empresa asociada."
                  : "Delete this company? Its contacts will be unlinked."}
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

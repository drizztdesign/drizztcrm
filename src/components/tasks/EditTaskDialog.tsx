"use client";
import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useUpdateTask, useDeleteTask } from "@/lib/queries/tasks";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import type { Task, TaskKind, TaskPriority } from "@/lib/supabase/types";

const KINDS: { id: TaskKind; labelEs: string; labelEn: string }[] = [
  { id: "call", labelEs: "Llamada", labelEn: "Call" },
  { id: "whatsapp", labelEs: "WhatsApp", labelEn: "WhatsApp" },
  { id: "email", labelEs: "Email", labelEn: "Email" },
  { id: "meeting", labelEs: "Reunión", labelEn: "Meeting" },
  { id: "note", labelEs: "Nota", labelEn: "Note" },
  { id: "proposal", labelEs: "Propuesta", labelEn: "Proposal" },
  { id: "payment", labelEs: "Pago", labelEn: "Payment" },
];

const PRIORITIES: { id: TaskPriority; labelEs: string; labelEn: string }[] = [
  { id: "urgent", labelEs: "Urgente", labelEn: "Urgent" },
  { id: "high", labelEs: "Alta", labelEn: "High" },
  { id: "normal", labelEs: "Normal", labelEn: "Normal" },
  { id: "low", labelEs: "Baja", labelEn: "Low" },
];

export function EditTaskDialog({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const { lang } = useT();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const show = useUI((s) => s.showToast);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TaskKind>("note");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setKind(task.kind);
      setDue(task.due ?? "");
      setPriority(task.priority);
      setConfirming(false);
    }
  }, [task]);

  if (!task) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update.mutate(
      {
        id: task.id,
        patch: { title: title.trim(), kind, due: due.trim(), priority },
      },
      {
        onSuccess: () => {
          show(lang === "es" ? "Tarea actualizada" : "Task updated", "ok");
          onClose();
        },
        onError: (err) => show(err instanceof Error ? err.message : "Error", "error"),
      }
    );
  };

  const onDelete = () => {
    del.mutate(task.id, {
      onSuccess: () => {
        show(lang === "es" ? "Tarea eliminada" : "Task deleted", "ok");
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] max-w-[92vw] bg-bg-1 border border-border rounded-2xl z-50 drawer-enter shadow-pop">
        <div className="flex items-center justify-between p-[18px_22px] border-b border-border">
          <h2 className="m-0 text-[16px] font-semibold">
            {lang === "es" ? "Editar tarea" : "Edit task"}
          </h2>
          <button onClick={onClose} className="text-fg-2 hover:text-fg-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={submit} className="p-[18px_22px] flex flex-col gap-3.5">
          <Field label={lang === "es" ? "Título" : "Title"}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "es" ? "Tipo" : "Kind"}>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as TaskKind)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {lang === "es" ? k.labelEs : k.labelEn}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={lang === "es" ? "Prioridad" : "Priority"}>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "es" ? p.labelEs : p.labelEn}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={lang === "es" ? "Vencimiento" : "Due"}>
            <input
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder={lang === "es" ? "Hoy, Mañana, Esta semana…" : "Today, Tomorrow, This week…"}
              className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent w-full"
            />
          </Field>

          {confirming ? (
            <div className="border border-danger rounded-lg bg-danger/5 p-3 flex flex-col gap-2.5">
              <div className="text-[12.5px] text-fg-1">
                {lang === "es" ? "¿Eliminar esta tarea?" : "Delete this task?"}
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
                disabled={!title.trim() || update.isPending}
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

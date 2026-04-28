"use client";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTasks, useToggleTask, useCreateTask, useDeleteTask } from "@/lib/queries/tasks";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Check, X, Plus, Pencil } from "lucide-react";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import type { Task } from "@/lib/supabase/types";

type Filter = "today" | "overdue" | "week" | "done" | "all";

export default function TareasPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { t, lang } = useT();
  const toggle = useToggleTask();
  const create = useCreateTask();
  const del = useDeleteTask();
  const openDeal = useUI((s) => s.openDeal);

  const [filter, setFilter] = useState<Filter>("today");
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const by = (q: string) => tasks.filter((x) => !x.done && (x.due === q || new RegExp(`^${q}`, "i").test(x.due)));
    switch (filter) {
      case "today": return by("Hoy");
      case "overdue": return tasks.filter((x) => !x.done && /pendiente/i.test(x.due));
      case "week":  return tasks.filter((x) => !x.done && /semana|mañana/i.test(x.due));
      case "done":  return tasks.filter((x) => x.done);
      default:      return tasks;
    }
  }, [tasks, filter]);

  const onAdd = () => {
    if (!newTitle.trim()) return;
    create.mutate({ title: newTitle.trim(), kind: "note", due: "Hoy", priority: "normal" });
    setNewTitle("");
  };

  return (
    <>
      <Topbar title={t("nav_tasks")} sub={`${tasks.filter((x) => !x.done).length} ${lang === "es" ? "pendientes" : "pending"}`} />
      <div className="px-[22px] py-2.5 border-b border-border flex items-center gap-2 overflow-x-auto">
        {(["today", "overdue", "week", "done", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex items-center px-2.5 py-1 text-[11.5px] rounded-md border whitespace-nowrap",
              filter === f ? "bg-accent-soft text-accent border-accent" : "bg-bg-2 text-fg-1 border-border hover:border-border-strong"
            )}
          >
            {f === "today" ? t("today") : f === "overdue" ? t("overdue") : f === "week" ? t("this_week") : f === "done" ? t("done_f") : t("all")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6 max-w-[900px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            placeholder={lang === "es" ? "Nueva tarea…" : "New task…"}
            className="flex-1 h-10 bg-bg-2 border border-border rounded-lg px-3 text-[13.5px] outline-none focus:border-accent"
          />
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px]">
            <Plus size={14} strokeWidth={2} />
            {t("add")}
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-[18px] py-2.5 border-b border-border">
                <Skeleton className="w-[18px] h-[18px] rounded-[5px] shrink-0" />
                <div className="flex-1 flex flex-col gap-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && (
          <div className="bg-bg-1 border border-border rounded-[14px] overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <div className="text-[40px] opacity-20">✅</div>
                <div className="text-[14px] font-medium text-fg-1">
                  {filter === "done"
                    ? (lang === "es" ? "Sin tareas completadas" : "No completed tasks")
                    : filter === "today"
                    ? (lang === "es" ? "Sin tareas para hoy 🎉" : "No tasks for today 🎉")
                    : filter === "overdue"
                    ? (lang === "es" ? "Sin tareas vencidas, excelente" : "No overdue tasks, great job")
                    : (lang === "es" ? "Sin tareas en este filtro" : "No tasks in this filter")}
                </div>
              </div>
            ) : filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-2 group">
                <button
                  onClick={() => toggle.mutate({ id: task.id, done: !task.done })}
                  className={cn(
                    "w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-border-strong grid place-items-center shrink-0 hover:border-accent",
                    task.done && "bg-accent border-accent"
                  )}
                >
                  {task.done && <Check size={11} strokeWidth={3} className="text-accent-ink" />}
                </button>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => task.deal?.id && openDeal(task.deal.id)}
                >
                  <div className={cn("text-[13px] font-medium truncate", task.done && "line-through text-fg-3")}>
                    {task.title}
                  </div>
                  {task.deal && <div className="text-[11.5px] text-fg-2 truncate">{task.deal.title}</div>}
                </div>
                <span className={cn(
                  "text-[11.5px] rounded-md px-2 py-0.5 tabular shrink-0",
                  task.priority === "urgent" || task.priority === "high" ? "bg-danger/15 text-danger" : "bg-bg-3 text-fg-1"
                )}>{task.due}</span>
                <button
                  onClick={() => setEditing(task)}
                  className="md:opacity-0 md:group-hover:opacity-100 text-fg-3 hover:text-accent transition-opacity"
                  aria-label="Edit task"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => del.mutate(task.id)}
                  className="md:opacity-0 md:group-hover:opacity-100 text-fg-3 hover:text-danger transition-opacity"
                  aria-label="Delete task"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <EditTaskDialog task={editing} onClose={() => setEditing(null)} />
    </>
  );
}

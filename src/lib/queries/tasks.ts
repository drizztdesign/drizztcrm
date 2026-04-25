"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskKind, TaskPriority } from "@/lib/supabase/types";

export function useTasks() {
  const sb = createClient();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<(Task & { deal?: { id: string; title: string; code: string } | null })[]> => {
      const { data, error } = await sb
        .from("tasks")
        .select("*, deal:deals(id, title, code)")
        .order("done", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (Task & { deal?: { id: string; title: string; code: string } | null })[];
    },
  });

  useEffect(() => {
    const channel = sb
      .channel(`tasks-realtime-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();
    return () => { void sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return q;
}

export function useToggleTask() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await sb
        .from("tasks")
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      if (prev) qc.setQueryData<Task[]>(["tasks"], prev.map(t => t.id === id ? { ...t, done } : t));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateTask() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; kind?: TaskKind; due?: string; priority?: TaskPriority; dealId?: string | null }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { error } = await sb.from("tasks").insert({
        owner_id: auth.user.id,
        title: input.title,
        kind: input.kind ?? "note",
        due: input.due ?? "",
        priority: input.priority ?? "normal",
        deal_id: input.dealId ?? null,
        done: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

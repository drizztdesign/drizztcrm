"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Template, Automation, ScoringRule } from "@/lib/supabase/types";

export function useTemplates() {
  const sb = createClient();
  return useQuery({
    queryKey: ["templates"],
    queryFn: async (): Promise<Template[]> => {
      const { data, error } = await sb.from("templates").select("*").order("stage").order("title");
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });
}

export function useUpdateTemplate() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Template> }) => {
      const { error } = await sb.from("templates").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useCreateTemplate() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Template> & { title: string; body: string }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { data, error } = await sb.from("templates").insert({
        owner_id: auth.user.id,
        title: input.title,
        body: input.body,
        subject: input.subject ?? "",
        channel: input.channel ?? "whatsapp",
        stage: input.stage ?? "lead",
        lang: input.lang ?? "es",
      }).select().single();
      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useAutomations() {
  const sb = createClient();
  return useQuery({
    queryKey: ["automations"],
    queryFn: async (): Promise<Automation[]> => {
      const { data, error } = await sb.from("automations").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Automation[];
    },
  });
}

export function useToggleAutomation() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await sb.from("automations").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useCreateAutomation() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Automation> & { name: string; trigger: Automation["trigger"]; action: Automation["action"] }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { data, error } = await sb.from("automations").insert({
        owner_id: auth.user.id,
        name: input.name,
        description_es: input.description_es ?? "",
        description_en: input.description_en ?? "",
        icon: input.icon ?? "🤖",
        enabled: input.enabled ?? true,
        trigger: input.trigger,
        action: input.action,
        stats: { fires: 0 },
      }).select().single();
      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useUpdateAutomation() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Automation> }) => {
      const { error } = await sb.from("automations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useDeleteAutomation() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useRunMyAutomations() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await sb.rpc("run_my_automations");
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["timeline-all"] });
    },
  });
}

export function useScoringRules() {
  const sb = createClient();
  return useQuery({
    queryKey: ["scoring"],
    queryFn: async (): Promise<ScoringRule[]> => {
      const { data, error } = await sb.from("scoring_rules").select("*").order("weight", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ScoringRule[];
    },
  });
}

export function useUpdateRule() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ScoringRule> }) => {
      const { error } = await sb.from("scoring_rules").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoring"] }),
  });
}

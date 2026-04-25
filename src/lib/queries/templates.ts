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

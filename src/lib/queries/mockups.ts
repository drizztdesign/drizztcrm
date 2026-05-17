"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DealMockup } from "@/lib/supabase/types";

export function useDealMockup(dealId: string | null | undefined) {
  const sb = createClient();
  return useQuery({
    queryKey: ["deal_mockup", dealId],
    enabled: !!dealId,
    queryFn: async (): Promise<DealMockup | null> => {
      if (!dealId) return null;
      const { data, error } = await sb
        .from("deal_mockups")
        .select("*")
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DealMockup | null;
    },
    // Poll every 3s while waiting for watcher
    refetchInterval: (query) => {
      const d = query.state.data as DealMockup | null | undefined;
      return d?.status === "pending" ? 3000 : false;
    },
  });
}

export function useUpsertMockup() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, html }: { dealId: string; html: string }) => {
      const { data, error } = await sb
        .from("deal_mockups")
        .upsert(
          { deal_id: dealId, html, status: "done", prompt: null, error_msg: null },
          { onConflict: "deal_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DealMockup;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["deal_mockup", vars.dealId] });
    },
  });
}

export function useDeleteMockup() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await sb.from("deal_mockups").delete().eq("deal_id", dealId);
      if (error) throw error;
    },
    onSuccess: (_data, dealId) => {
      qc.invalidateQueries({ queryKey: ["deal_mockup", dealId] });
    },
  });
}

/** Queue a request for the local watcher to process. */
export function useQueueWatcherMockup() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, prompt }: { dealId: string; prompt: string }) => {
      const { data, error } = await sb
        .from("deal_mockups")
        .upsert(
          { deal_id: dealId, html: null, status: "pending", prompt, error_msg: null },
          { onConflict: "deal_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DealMockup;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["deal_mockup", vars.dealId] });
    },
  });
}

/** Trigger the paid API generation flow. Posts dealId to /api/generate-mockup. */
export function useGenerateMockupApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      const r = await fetch("/api/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      return data as { html: string };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["deal_mockup", vars.dealId] });
    },
  });
}

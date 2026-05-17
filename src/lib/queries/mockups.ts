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
  });
}

export function useUpsertMockup() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, html }: { dealId: string; html: string }) => {
      const { data, error } = await sb
        .from("deal_mockups")
        .upsert({ deal_id: dealId, html }, { onConflict: "deal_id" })
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

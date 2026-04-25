"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Deal, DealWithRelations, LeadStage } from "@/lib/supabase/types";
import { nanoid } from "nanoid";

const DEALS_KEY = ["deals"] as const;

export function useDeals() {
  const sb = createClient();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: DEALS_KEY,
    queryFn: async (): Promise<DealWithRelations[]> => {
      const { data, error } = await sb
        .from("deals")
        .select("*, company:companies(*), contact:contacts(*)")
        .order("stage_entered_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DealWithRelations[];
    },
  });

  useEffect(() => {
    const channel = sb
      .channel(`deals-realtime-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => {
        qc.invalidateQueries({ queryKey: DEALS_KEY });
      })
      .subscribe();
    return () => { void sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return q;
}

export function useDeal(id: string | null) {
  const sb = createClient();
  return useQuery({
    queryKey: ["deal", id],
    enabled: !!id,
    queryFn: async (): Promise<DealWithRelations | null> => {
      if (!id) return null;
      const { data, error } = await sb
        .from("deals")
        .select("*, company:companies(*), contact:contacts(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as DealWithRelations;
    },
  });
}

export function useUpdateDealStage() {
  const sb = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: LeadStage }) => {
      const now = new Date().toISOString();
      const { error } = await sb
        .from("deals")
        .update({ stage, stage_entered_at: now, last_touch: now })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: DEALS_KEY });
      const prev = qc.getQueryData<DealWithRelations[]>(DEALS_KEY);
      if (prev) {
        qc.setQueryData<DealWithRelations[]>(
          DEALS_KEY,
          prev.map((d) => (d.id === id ? { ...d, stage } : d))
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(DEALS_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: DEALS_KEY });
    },
  });
}

export function useCreateDeal() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partial: Partial<Deal> & { title: string }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const code = partial.code ?? `L-${nanoid(6).toUpperCase()}`;
      const { data, error } = await sb
        .from("deals")
        .insert({
          ...partial,
          owner_id: auth.user.id,
          code,
          title: partial.title,
          stage: partial.stage ?? "lead",
          temp: partial.temp ?? "cold",
          score: partial.score ?? 40,
          price_estimated: partial.price_estimated ?? 0,
          source: partial.source ?? "web",
          project_type: partial.project_type ?? "landing",
          pain: partial.pain ?? "no_web",
          next_action_status: partial.next_action_status ?? "missing",
          tags: partial.tags ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEALS_KEY }),
  });
}

export function useUpdateDeal() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Deal> }) => {
      const { error } = await sb.from("deals").update({ ...patch, last_touch: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: DEALS_KEY });
      qc.invalidateQueries({ queryKey: ["deal", v.id] });
    },
  });
}

export function useDeleteDeal() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DEALS_KEY }),
  });
}

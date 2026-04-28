"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Proposal, ProposalPackage } from "@/lib/supabase/types";

export type ProposalWithDeal = Proposal & {
  deal?: { id: string; title: string; company?: { name: string } | null; contact?: { name: string } | null } | null;
};

export function useProposals() {
  const sb = createClient();
  return useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<ProposalWithDeal[]> => {
      const { data, error } = await sb
        .from("proposals")
        .select("*, deal:deals(id, title, company:companies(name), contact:contacts(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProposalWithDeal[];
    },
  });
}

export function useCreateProposal() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      deal_id: string;
      package_key: ProposalPackage;
      title: string;
      items: { label: string; value?: string }[];
      subtotal: number;
      tax: number;
      grand_total: number;
    }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { data, error } = await sb
        .from("proposals")
        .insert({ owner_id: auth.user.id, ...input, status: "draft" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function useUpdateProposalStatus() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "sent" | "signed" | "rejected" }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "sent") patch.sent_at = new Date().toISOString();
      if (status === "signed") patch.signed_at = new Date().toISOString();
      const { error } = await sb.from("proposals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function useDeleteProposal() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

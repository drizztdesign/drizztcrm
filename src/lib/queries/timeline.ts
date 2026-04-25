"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TimelineEvent, TimelineKind } from "@/lib/supabase/types";

export function useTimeline(dealId: string | null) {
  const sb = createClient();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["timeline", dealId],
    enabled: !!dealId,
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!dealId) return [];
      const { data, error } = await sb
        .from("timeline_events")
        .select("*")
        .eq("deal_id", dealId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimelineEvent[];
    },
  });

  useEffect(() => {
    if (!dealId) return;
    const channel = sb
      .channel(`timeline-${dealId}-${crypto.randomUUID()}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "timeline_events", filter: `deal_id=eq.${dealId}` },
        () => qc.invalidateQueries({ queryKey: ["timeline", dealId] })
      )
      .subscribe();
    return () => { void sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  return q;
}

export function useAllTimeline(limit = 50) {
  const sb = createClient();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["timeline-all", limit],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const { data, error } = await sb
        .from("timeline_events")
        .select("*, deal:deals(id, title, code, company_id), contact:contacts(name, avatar)")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as TimelineEvent[];
    },
  });

  useEffect(() => {
    const channel = sb
      .channel(`timeline-all-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, () => {
        qc.invalidateQueries({ queryKey: ["timeline-all"] });
      })
      .subscribe();
    return () => { void sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return q;
}

export function useAddTimelineEvent() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { dealId: string; kind: TimelineKind; who: string; body: string; t?: string }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const now = new Date();
      const { error } = await sb.from("timeline_events").insert({
        owner_id: auth.user.id,
        deal_id: input.dealId,
        kind: input.kind,
        who: input.who,
        body: input.body,
        t: input.t ?? formatRelativeEs(now),
        occurred_at: now.toISOString(),
      });
      if (error) throw error;
      await sb.from("deals").update({ last_touch: now.toISOString() }).eq("id", input.dealId);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["timeline", v.dealId] });
      qc.invalidateQueries({ queryKey: ["timeline-all"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

function formatRelativeEs(d: Date): string {
  return "Ahora " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

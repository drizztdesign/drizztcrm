"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Mounts ONE realtime channel for the whole app and routes change events
 * to React Query invalidations. This avoids the per-hook subscriptions that
 * were creating many channels when navigating between pages.
 *
 * Place under (app)/layout.tsx so it lives for the whole authed session.
 */
export function RealtimeProvider() {
  const qc = useQueryClient();

  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("crm-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => {
        qc.invalidateQueries({ queryKey: ["deals"] });
        qc.invalidateQueries({ queryKey: ["deal"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, () => {
        qc.invalidateQueries({ queryKey: ["timeline"] });
        qc.invalidateQueries({ queryKey: ["timeline-all"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        qc.invalidateQueries({ queryKey: ["companies"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {
        qc.invalidateQueries({ queryKey: ["contacts"] });
      })
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

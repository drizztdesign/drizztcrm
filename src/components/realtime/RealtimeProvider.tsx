"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Mounts realtime listeners ONCE for the whole authed session.
 *
 * Note: Supabase Realtime does NOT reliably deliver events when multiple
 * `.on('postgres_changes', ...)` filters are chained on a single channel.
 * We therefore use one channel per table. This still avoids the previous
 * per-hook subscriptions (one channel per table per page mount).
 */
export function RealtimeProvider() {
  const qc = useQueryClient();

  useEffect(() => {
    const sb = createClient();

    const dealsCh = sb
      .channel("rt-deals")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => {
        qc.invalidateQueries({ queryKey: ["deals"] });
        qc.invalidateQueries({ queryKey: ["deal"] });
      })
      .subscribe();

    const tasksCh = sb
      .channel("rt-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();

    const timelineCh = sb
      .channel("rt-timeline")
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, () => {
        qc.invalidateQueries({ queryKey: ["timeline"] });
        qc.invalidateQueries({ queryKey: ["timeline-all"] });
      })
      .subscribe();

    const companiesCh = sb
      .channel("rt-companies")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        qc.invalidateQueries({ queryKey: ["companies"] });
      })
      .subscribe();

    const contactsCh = sb
      .channel("rt-contacts")
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {
        qc.invalidateQueries({ queryKey: ["contacts"] });
      })
      .subscribe();

    return () => {
      void sb.removeChannel(dealsCh);
      void sb.removeChannel(tasksCh);
      void sb.removeChannel(timelineCh);
      void sb.removeChannel(companiesCh);
      void sb.removeChannel(contactsCh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

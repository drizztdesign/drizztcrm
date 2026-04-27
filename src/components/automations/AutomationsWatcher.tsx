"use client";
import { useEffect, useRef } from "react";
import { useAutomations } from "@/lib/queries/templates";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/useT";

const STORAGE_KEY = "drizzt-automations-last-seen";

/**
 * On app load: if any active automation has run since the last time the user
 * was here, show a one-time toast summarizing how many fired.
 *
 * "Last seen" timestamp is persisted in localStorage so the toast doesn't
 * re-trigger on every page navigation within the same session.
 */
export function AutomationsWatcher() {
  const { data: autos = [] } = useAutomations();
  const show = useUI((s) => s.showToast);
  const { lang } = useT();
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) return;
    if (autos.length === 0) return;

    const lastSeenStr = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;

    const fresh = autos.filter((a) => {
      if (!a.last_run_at) return false;
      return new Date(a.last_run_at).getTime() > lastSeen;
    });

    if (fresh.length > 0 && lastSeen > 0) {
      announced.current = true;
      const msg = lang === "es"
        ? `${fresh.length} automatización${fresh.length === 1 ? "" : "es"} ejecutada${fresh.length === 1 ? "" : "s"} desde tu última visita`
        : `${fresh.length} automation${fresh.length === 1 ? "" : "s"} fired since you were last here`;
      show(msg, "ok");
    }

    // Update last seen to now
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, [autos, show, lang]);

  return null;
}

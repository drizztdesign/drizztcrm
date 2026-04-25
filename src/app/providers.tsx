"use client";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTweaks, hexToAccentVars } from "@/store/tweaks";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Realtime subscriptions invalidate caches when data changes,
            // so we don't need aggressive auto-refetching.
            staleTime: 5 * 60_000,        // 5 min — treat data as fresh
            gcTime: 30 * 60_000,           // 30 min — keep data in memory across navigations
            refetchOnWindowFocus: false,
            refetchOnMount: false,         // re-mounting a page reuses cache instantly
            refetchOnReconnect: false,
          },
        },
      })
  );

  const accent = useTweaks((s) => s.accent);
  const density = useTweaks((s) => s.density);

  useEffect(() => {
    const vars = hexToAccentVars(accent);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [accent]);

  useEffect(() => {
    document.body.setAttribute("data-density", density);
  }, [density]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

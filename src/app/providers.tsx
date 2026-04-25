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
            staleTime: 30_000,
            refetchOnWindowFocus: false,
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

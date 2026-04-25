"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/supabase/types";

export type Density = "compact" | "regular" | "cozy";

interface TweaksState {
  lang: Lang;
  accent: string;
  density: Density;
  setLang: (l: Lang) => void;
  setAccent: (c: string) => void;
  setDensity: (d: Density) => void;
  reset: () => void;
}

const DEFAULTS = {
  lang: "es" as Lang,
  accent: "#a8ff3e",
  density: "regular" as Density,
};

export const useTweaks = create<TweaksState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLang: (lang) => set({ lang }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      reset: () => set(DEFAULTS),
    }),
    { name: "drizzt-tweaks" }
  )
);

export function hexToAccentVars(hex: string): Record<string, string> {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const isLight = r + g + b > 420;
  return {
    "--accent": hex,
    "--accent-ink": isLight ? "#0a0b0d" : "#ffffff",
    "--accent-soft": `rgba(${r},${g},${b},0.14)`,
    "--accent-strong": `rgb(${Math.min(255, r + 25)},${Math.min(255, g + 25)},${Math.min(255, b + 25)})`,
  };
}

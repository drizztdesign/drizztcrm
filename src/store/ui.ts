"use client";
import { create } from "zustand";
import type { LeadStage, LeadTemp, LeadSource } from "@/lib/supabase/types";

export interface Filters {
  stage: LeadStage | "all";
  temp: LeadTemp | "all";
  source: LeadSource | "all";
  tag: string | "all";
}

interface UIState {
  selectedDealId: string | null;
  tweaksOpen: boolean;
  sidebarOpen: boolean;
  cmdOpen: boolean;
  search: string;
  filters: Filters;
  toast: { id: number; message: string; kind: "ok" | "error" | "info" } | null;

  openDeal: (id: string) => void;
  closeDeal: () => void;
  toggleTweaks: () => void;
  setTweaksOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  toggleCmd: () => void;
  setCmdOpen: (v: boolean) => void;
  setSearch: (s: string) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  clearFilters: () => void;
  showToast: (message: string, kind?: "ok" | "error" | "info") => void;
  clearToast: () => void;
}

const DEFAULT_FILTERS: Filters = { stage: "all", temp: "all", source: "all", tag: "all" };

export const useUI = create<UIState>((set) => ({
  selectedDealId: null,
  tweaksOpen: false,
  sidebarOpen: false,
  cmdOpen: false,
  search: "",
  filters: DEFAULT_FILTERS,
  toast: null,

  openDeal: (id) => set({ selectedDealId: id }),
  closeDeal: () => set({ selectedDealId: null }),
  toggleTweaks: () => set((s) => ({ tweaksOpen: !s.tweaksOpen })),
  setTweaksOpen: (v) => set({ tweaksOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleCmd: () => set((s) => ({ cmdOpen: !s.cmdOpen })),
  setCmdOpen: (v) => set({ cmdOpen: v }),
  setSearch: (s) => set({ search: s }),
  setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
  showToast: (message, kind = "ok") => set({ toast: { id: Date.now(), message, kind } }),
  clearToast: () => set({ toast: null }),
}));

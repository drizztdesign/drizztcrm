"use client";
import { useTweaks } from "@/store/tweaks";
import { translate } from "@/lib/i18n";

export function useT() {
  const lang = useTweaks((s) => s.lang);
  return {
    t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    lang,
  };
}

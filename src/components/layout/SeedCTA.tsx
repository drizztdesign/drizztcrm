"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/useT";

export function SeedCTA() {
  const [loading, setLoading] = useState(false);
  const show = useUI((s) => s.showToast);
  const router = useRouter();
  const { t, lang } = useT();

  const run = async () => {
    setLoading(true);
    const sb = createClient();
    const { error } = await sb.rpc("seed_demo_data");
    setLoading(false);
    if (error) {
      show(error.message, "error");
    } else {
      show(lang === "es" ? "Datos de ejemplo cargados" : "Demo data loaded", "ok");
      router.refresh();
      window.location.reload();
    }
  };

  return (
    <button
      onClick={run}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-60 shadow-card"
    >
      <Sparkles size={14} strokeWidth={2} />
      {loading ? t("seeding") : t("seed_demo")}
    </button>
  );
}

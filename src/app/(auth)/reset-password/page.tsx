"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/useT";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useT();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw1 !== pw2) {
      setError(t("auth_reset_mismatch"));
      return;
    }
    setLoading(true);
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.updateUser({ password: pw1 });
      if (err) throw err;
      setDone(true);
      setTimeout(() => {
        router.replace("/inicio");
        router.refresh();
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth_reset_title")}>
      {done ? (
        <p className="text-[13px] text-accent">{t("auth_reset_done")}</p>
      ) : (
        <>
          <p className="text-[12.5px] text-fg-2 mb-4 leading-relaxed">{t("auth_reset_sub")}</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <AuthField label={t("auth_reset_new")} value={pw1} onChange={setPw1} type="password" required />
            <AuthField label={t("auth_reset_confirm")} value={pw2} onChange={setPw2} type="password" required />
            {error && <div className="text-[12px] text-danger">{error}</div>}
            <button
              type="submit"
              disabled={loading || !pw1 || !pw2}
              className="mt-2 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
            >
              {loading ? t("auth_loading") : t("auth_reset_cta")}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

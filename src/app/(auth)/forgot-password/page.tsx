"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/useT";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sb = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: err } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth_forgot_title")}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-fg-1 leading-relaxed">{t("auth_forgot_sent")}</p>
          <Link href="/login" className="text-[12px] text-accent hover:underline text-center">
            ← {t("auth_back_to_login")}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-[12.5px] text-fg-2 mb-4 leading-relaxed">{t("auth_forgot_sub")}</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <AuthField label={t("auth_email")} value={email} onChange={setEmail} type="email" required />
            {error && <div className="text-[12px] text-danger">{error}</div>}
            <button
              type="submit"
              disabled={loading || !email}
              className="mt-2 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
            >
              {loading ? t("auth_loading") : t("auth_forgot_cta")}
            </button>
          </form>
          <p className="mt-5 text-[12px] text-fg-2 text-center">
            <Link href="/login" className="text-accent hover:underline">
              ← {t("auth_back_to_login")}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

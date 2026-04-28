"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/useT";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error: err } = await sb.auth.signUp({ email, password });
      if (err) throw err;

      if (data.session) {
        router.replace("/inicio");
        router.refresh();
      } else {
        setInfo(t("auth_check_email"));
        setLoading(false);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-bg-0 overflow-y-auto py-10">
      <div className="w-[380px] max-w-[92vw] rounded-2xl border border-border bg-bg-1 p-7 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg grid place-items-center text-[14px] font-extrabold"
               style={{ background: "radial-gradient(120% 120% at 0% 0%, var(--accent) 0%, #4a7c1f 100%)", color: "#0a0b0d" }}>
            D
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold tracking-[0.02em]">DRIZZT</span>
            <span className="text-[10px] text-fg-2 tracking-[0.16em] uppercase">CRM · Design</span>
          </div>
        </div>
        <h1 className="text-[20px] font-semibold -tracking-[0.01em] mb-5">{t("auth_signup_title")}</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-fg-2 uppercase tracking-[0.1em]">{t("auth_email")}</span>
            <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-fg-2 uppercase tracking-[0.1em]">{t("auth_password")}</span>
            <div className="relative">
              <input
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                className="h-10 w-full rounded-lg bg-bg-2 border border-border px-3 pr-9 text-[13.5px] outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1"
              >
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>
          {error && <div className="text-[12px] text-danger">{error}</div>}
          {info && <div className="text-[12px] text-ok">{info}</div>}
          <button type="submit" disabled={loading} className="mt-2 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60">
            {loading ? t("auth_loading") : t("auth_signup")}
          </button>
        </form>
        <p className="mt-5 text-[12px] text-fg-2 text-center">
          {t("auth_have_account")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("auth_log_in_cta")}
          </Link>
        </p>
      </div>
    </div>
  );
}

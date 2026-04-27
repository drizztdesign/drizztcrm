"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/useT";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <LoginInner />
    </Suspense>
  );
}

function LoadingShell() {
  return <div className="min-h-screen grid place-items-center bg-bg-0 text-fg-2 text-sm">…</div>;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const next = params.get("next") || "/inicio";
      router.replace(next);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth_login_title")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label={t("auth_email")} value={email} onChange={setEmail} type="email" required />
        <Field label={t("auth_password")} value={password} onChange={setPassword} type="password" required />
        {error && <div className="text-[12px] text-danger">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 rounded-lg bg-accent text-accent-ink font-semibold text-[13px] hover:brightness-105 disabled:opacity-60"
        >
          {loading ? t("auth_loading") : t("auth_login")}
        </button>
      </form>
      <p className="mt-3 text-[12px] text-fg-2 text-center">
        <Link href="/forgot-password" className="text-fg-2 hover:text-accent hover:underline">
          {t("auth_forgot")}
        </Link>
      </p>
      <p className="mt-3 text-[12px] text-fg-2 text-center">
        {t("auth_no_account")}{" "}
        <Link href="/signup" className="text-accent hover:underline">
          {t("auth_sign_up_cta")}
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
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
        <h1 className="text-[20px] font-semibold -tracking-[0.01em] mb-5">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-fg-2 uppercase tracking-[0.1em]">{label}</span>
      <input
        value={value}
        required={required}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg bg-bg-2 border border-border px-3 text-[13.5px] outline-none focus:border-accent transition-colors"
      />
    </label>
  );
}

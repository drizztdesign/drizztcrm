"use client";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-bg-0 overflow-y-auto py-10">
      <div className="w-[380px] max-w-[92vw] rounded-2xl border border-border bg-bg-1 p-7 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg grid place-items-center text-[14px] font-extrabold"
            style={{
              background: "radial-gradient(120% 120% at 0% 0%, var(--accent) 0%, #4a7c1f 100%)",
              color: "#0a0b0d",
            }}
          >
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

export function AuthField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
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

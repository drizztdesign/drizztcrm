"use client";
import { useEffect } from "react";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";

export function Toast() {
  const toast = useUI((s) => s.toast);
  const clearToast = useUI((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[60] min-w-[240px] max-w-[420px] rounded-lg border px-4 py-3 shadow-pop",
        toast.kind === "ok" && "bg-bg-1 border-ok text-fg-0",
        toast.kind === "error" && "bg-bg-1 border-danger text-fg-0",
        toast.kind === "info" && "bg-bg-1 border-info text-fg-0"
      )}
    >
      <div className="text-[13px]">{toast.message}</div>
    </div>
  );
}

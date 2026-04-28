"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 grid place-items-center p-8">
      <div className="text-center max-w-[380px]">
        <div className="text-[48px] mb-4">⚠️</div>
        <h2 className="text-[18px] font-semibold text-fg-0 mb-2">
          Algo salió mal
        </h2>
        <p className="text-[13px] text-fg-2 mb-6 leading-relaxed">
          {error.message || "Ha ocurrido un error inesperado en esta página."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-accent text-accent-ink text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

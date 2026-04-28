export default function Loading() {
  return (
    <div className="flex-1 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-[12px] text-fg-2">Cargando…</span>
      </div>
    </div>
  );
}

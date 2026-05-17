"use client";
import { useState } from "react";
import {
  Clipboard, Check, Download, Trash2, RefreshCw, ExternalLink, Loader2,
  FileCode, Sparkles, Plug, AlertTriangle,
} from "lucide-react";
import type { DealWithRelations } from "@/lib/supabase/types";
import {
  useDealMockup, useUpsertMockup, useDeleteMockup,
  useQueueWatcherMockup, useGenerateMockupApi,
} from "@/lib/queries/mockups";
import { buildMockupPrompt } from "@/lib/mockup-prompt";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";

type Mode = "menu" | "manual" | "waiting";

export function MockupTab({ deal }: { deal: DealWithRelations }) {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const { data: mockup, isLoading } = useDealMockup(deal.id);
  const upsert = useUpsertMockup();
  const del = useDeleteMockup();
  const queueWatcher = useQueueWatcherMockup();
  const generateApi = useGenerateMockupApi();

  const [mode, setMode] = useState<Mode>("menu");
  const [pasted, setPasted] = useState("");
  const [copying, setCopying] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isPending = mockup?.status === "pending";
  const isError = mockup?.status === "error";
  const hasDone = mockup?.status === "done" && mockup.html;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildMockupPrompt(deal, lang));
      setCopying(true);
      show(lang === "es" ? "Prompt copiado" : "Prompt copied", "ok");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      show(lang === "es" ? "No se pudo copiar" : "Could not copy", "error");
    }
  };

  const triggerApi = async () => {
    try {
      await generateApi.mutateAsync({ dealId: deal.id });
      show(lang === "es" ? "Modelo generado" : "Mockup generated", "ok");
      setMode("menu");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const triggerWatcher = async () => {
    try {
      await queueWatcher.mutateAsync({
        dealId: deal.id,
        prompt: buildMockupPrompt(deal, lang),
      });
      setMode("waiting");
      show(lang === "es" ? "Petición enviada al watcher" : "Request sent to watcher", "ok");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const savePasted = async () => {
    if (!pasted.trim()) return;
    try {
      await upsert.mutateAsync({ dealId: deal.id, html: pasted });
      setPasted("");
      setMode("menu");
      show(lang === "es" ? "Modelo guardado" : "Mockup saved", "ok");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const download = () => {
    if (!mockup?.html) return;
    const slug = (deal.company?.name ?? deal.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const blob = new Blob([mockup.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "mockup"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInTab = () => {
    if (!mockup?.html) return;
    const blob = new Blob([mockup.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const deleteMockup = async () => {
    try {
      await del.mutateAsync(deal.id);
      setConfirmDel(false);
      setMode("menu");
      show(lang === "es" ? "Modelo borrado" : "Mockup deleted", "ok");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-fg-2 text-[13px]">
        <Loader2 size={16} className="animate-spin mr-2" />
        {lang === "es" ? "Cargando…" : "Loading…"}
      </div>
    );
  }

  // === PENDING (watcher in progress) ===
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-[480px] mx-auto text-center">
        <Loader2 size={36} className="animate-spin text-accent" />
        <h3 className="text-[15px] font-semibold m-0">
          {lang === "es" ? "Esperando al watcher…" : "Waiting for watcher…"}
        </h3>
        <p className="text-[12.5px] text-fg-2 leading-relaxed">
          {lang === "es"
            ? "Si tienes el watcher corriendo en tu PC, el mockup aparecerá aquí en unos segundos. Si no, arráncalo con `node scripts/mockup-watcher.mjs` (o haz doble clic en watcher.bat)."
            : "If your watcher is running on your PC, the mockup will appear here in a few seconds. Otherwise, start it with `node scripts/mockup-watcher.mjs`."}
        </p>
        <button
          onClick={async () => { await del.mutateAsync(deal.id); }}
          className="text-[11.5px] text-fg-3 hover:text-danger underline"
        >
          {lang === "es" ? "Cancelar petición" : "Cancel request"}
        </button>
      </div>
    );
  }

  // === ERROR ===
  if (isError) {
    return (
      <div className="flex flex-col gap-3 max-w-[560px]">
        <div className="border border-danger rounded-lg bg-danger/5 p-4 flex gap-3 items-start">
          <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-[13.5px] font-semibold m-0 text-danger">
              {lang === "es" ? "Error al generar" : "Generation error"}
            </h3>
            <p className="text-[12px] text-fg-1 mt-1 font-mono break-all">{mockup?.error_msg}</p>
          </div>
        </div>
        <button
          onClick={async () => { await del.mutateAsync(deal.id); }}
          className="self-start inline-flex items-center gap-2 px-3 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium hover:border-border-strong"
        >
          {lang === "es" ? "Volver a intentar" : "Try again"}
        </button>
      </div>
    );
  }

  // === DONE (mockup exists) ===
  if (hasDone && mode === "menu") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-fg-2">
            {lang === "es" ? "Guardado" : "Saved"} ·{" "}
            {new Date(mockup.updated_at).toLocaleString(lang === "es" ? "es-ES" : "en-US")}
          </span>
          <div className="ml-auto flex gap-1.5 flex-wrap">
            <button onClick={openInTab}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-border-strong text-[11.5px] font-medium">
              <ExternalLink size={12} strokeWidth={1.5} />
              {lang === "es" ? "Abrir" : "Open"}
            </button>
            <button onClick={download}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-border-strong text-[11.5px] font-medium">
              <Download size={12} strokeWidth={1.5} />
              {lang === "es" ? "Descargar" : "Download"}
            </button>
            <button onClick={() => setMode("menu")} disabled
              className="hidden" />
            <button onClick={async () => { await del.mutateAsync(deal.id); setMode("menu"); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-accent hover:text-accent text-[11.5px] font-medium">
              <RefreshCw size={12} strokeWidth={1.5} />
              {lang === "es" ? "Regenerar" : "Regenerate"}
            </button>
            <button onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-danger hover:text-danger text-[11.5px] font-medium">
              <Trash2 size={12} strokeWidth={1.5} />
              {lang === "es" ? "Borrar" : "Delete"}
            </button>
          </div>
        </div>

        {confirmDel && (
          <div className="border border-danger rounded-lg bg-danger/5 p-3 flex items-center gap-3 text-[12.5px]">
            <span className="flex-1">{lang === "es" ? "¿Borrar este modelo?" : "Delete this mockup?"}</span>
            <button onClick={() => setConfirmDel(false)}
              className="px-3 h-8 rounded-md bg-bg-2 border border-border text-[12px]">
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button onClick={deleteMockup} disabled={del.isPending}
              className="px-3 h-8 rounded-md bg-danger text-white text-[12px] font-semibold disabled:opacity-60">
              {del.isPending ? "…" : (lang === "es" ? "Sí, borrar" : "Yes, delete")}
            </button>
          </div>
        )}

        <iframe
          srcDoc={mockup.html ?? ""}
          sandbox="allow-same-origin"
          className="w-full h-[640px] rounded-lg border border-border bg-white"
          title={`Mockup ${deal.company?.name ?? deal.title}`}
        />
      </div>
    );
  }

  // === MANUAL paste mode ===
  if (mode === "manual") {
    return (
      <div className="flex flex-col gap-4 max-w-[680px]">
        <button onClick={() => setMode("menu")} className="self-start text-[12px] text-fg-2 hover:text-fg-0">
          ← {lang === "es" ? "Volver" : "Back"}
        </button>

        <div>
          <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
            {lang === "es" ? "1. Copia el prompt" : "1. Copy the prompt"}
          </div>
          <button onClick={copyPrompt}
            className={cn(
              "inline-flex items-center gap-2 px-4 h-10 rounded-lg font-semibold text-[13px] transition-colors",
              copying ? "bg-ok text-white" : "bg-accent text-accent-ink hover:brightness-105"
            )}>
            {copying ? <Check size={14} strokeWidth={2} /> : <Clipboard size={14} strokeWidth={1.8} />}
            {copying
              ? (lang === "es" ? "Copiado" : "Copied")
              : (lang === "es" ? "Copiar prompt" : "Copy prompt")}
          </button>
        </div>

        <div>
          <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
            {lang === "es" ? "2. Pega en Claude Code" : "2. Paste in Claude Code"}
          </div>
          <ol className="text-[12.5px] text-fg-1 leading-relaxed pl-5 list-decimal space-y-1">
            <li>{lang === "es" ? "Abre VSCode en una carpeta vacía" : "Open VSCode in an empty folder"}</li>
            <li>{lang === "es" ? "Lanza Claude Code y pega el prompt" : "Launch Claude Code and paste the prompt"}</li>
            <li>{lang === "es" ? "Espera a que genere index.html (~1-2 min)" : "Wait for index.html (~1-2 min)"}</li>
            <li>{lang === "es" ? "Copia todo el contenido del archivo" : "Copy the file contents"}</li>
          </ol>
        </div>

        <div>
          <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
            {lang === "es" ? "3. Pega el HTML aquí" : "3. Paste the HTML here"}
          </div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="<!DOCTYPE html>..."
            className="w-full h-[200px] rounded-lg bg-bg-2 border border-border px-3 py-2 text-[12px] font-mono outline-none focus:border-accent resize-y"
          />
          <button onClick={savePasted} disabled={!pasted.trim() || upsert.isPending}
            className="mt-2 inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-50">
            {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {upsert.isPending
              ? (lang === "es" ? "Guardando…" : "Saving…")
              : (lang === "es" ? "Guardar modelo" : "Save mockup")}
          </button>
        </div>
      </div>
    );
  }

  // === MENU (3 options) ===
  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-soft/40 border border-accent/30">
        <FileCode size={20} className="text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <h3 className="text-[13.5px] font-semibold m-0">
            {lang === "es" ? "Genera un modelo de web para este lead" : "Generate a web mockup for this lead"}
          </h3>
          <p className="text-[12px] text-fg-1 mt-1 leading-relaxed">
            {lang === "es"
              ? "Elige cómo quieres generarlo. Las 3 opciones producen el mismo resultado."
              : "Choose how to generate it. All 3 options produce the same output."}
          </p>
        </div>
      </div>

      {/* OPCIÓN 1 — API */}
      <ModeCard
        icon={<Sparkles size={18} className="text-accent" strokeWidth={1.5} />}
        title={lang === "es" ? "Generar con API" : "Generate with API"}
        subtitle={lang === "es" ? "~15s · ~$0.08 · funciona en móvil" : "~15s · ~$0.08 · works on mobile"}
        cta={generateApi.isPending
          ? (lang === "es" ? "Generando…" : "Generating…")
          : (lang === "es" ? "Generar ahora" : "Generate now")}
        loading={generateApi.isPending}
        onClick={triggerApi}
        primary
      />

      {/* OPCIÓN 2 — Watcher */}
      <ModeCard
        icon={<Plug size={18} className="text-accent" strokeWidth={1.5} />}
        title={lang === "es" ? "Generar con watcher local" : "Generate with local watcher"}
        subtitle={lang === "es" ? "~30-60s · gratis · necesita watcher activo" : "~30-60s · free · needs watcher running"}
        cta={queueWatcher.isPending
          ? (lang === "es" ? "Enviando…" : "Sending…")
          : (lang === "es" ? "Enviar al watcher" : "Send to watcher")}
        loading={queueWatcher.isPending}
        onClick={triggerWatcher}
      />

      {/* OPCIÓN 3 — Manual */}
      <ModeCard
        icon={<Clipboard size={18} className="text-fg-2" strokeWidth={1.5} />}
        title={lang === "es" ? "Manual (copiar/pegar)" : "Manual (copy/paste)"}
        subtitle={lang === "es" ? "Gratis · funciona siempre" : "Free · always works"}
        cta={lang === "es" ? "Empezar" : "Start"}
        onClick={() => setMode("manual")}
      />
    </div>
  );
}

function ModeCard({
  icon, title, subtitle, cta, loading, onClick, primary,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  loading?: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border bg-bg-1",
      primary ? "border-accent/40" : "border-border"
    )}>
      <div className="w-10 h-10 rounded-lg bg-bg-2 border border-border grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[11.5px] text-fg-2 mt-0.5">{subtitle}</div>
      </div>
      <button onClick={onClick} disabled={loading}
        className={cn(
          "inline-flex items-center gap-2 px-3.5 h-9 rounded-md font-semibold text-[12.5px] shrink-0 disabled:opacity-50",
          primary
            ? "bg-accent text-accent-ink hover:brightness-105"
            : "bg-bg-2 border border-border hover:border-border-strong"
        )}>
        {loading && <Loader2 size={13} className="animate-spin" />}
        {cta}
      </button>
    </div>
  );
}

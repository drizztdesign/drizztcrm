"use client";
import { useState } from "react";
import { Clipboard, Check, Download, Trash2, RefreshCw, ExternalLink, Loader2, FileCode } from "lucide-react";
import type { DealWithRelations } from "@/lib/supabase/types";
import { useDealMockup, useUpsertMockup, useDeleteMockup } from "@/lib/queries/mockups";
import { buildMockupPrompt } from "@/lib/mockup-prompt";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";

export function MockupTab({ deal }: { deal: DealWithRelations }) {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const { data: mockup, isLoading } = useDealMockup(deal.id);
  const upsert = useUpsertMockup();
  const del = useDeleteMockup();

  const [pasted, setPasted] = useState("");
  const [copying, setCopying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const copyPrompt = async () => {
    const prompt = buildMockupPrompt(deal, lang);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopying(true);
      show(lang === "es" ? "Prompt copiado al portapapeles" : "Prompt copied to clipboard", "ok");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      show(lang === "es" ? "No se pudo copiar" : "Could not copy", "error");
    }
  };

  const save = async () => {
    if (!pasted.trim()) return;
    try {
      await upsert.mutateAsync({ dealId: deal.id, html: pasted });
      setPasted("");
      setEditing(false);
      show(lang === "es" ? "Modelo guardado" : "Mockup saved", "ok");
    } catch (e) {
      show(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const download = () => {
    if (!mockup) return;
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
    if (!mockup) return;
    const blob = new Blob([mockup.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const deleteMockup = async () => {
    try {
      await del.mutateAsync(deal.id);
      setConfirmDel(false);
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

  // Estado B — Con mockup
  if (mockup && !editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-fg-2">
            {lang === "es" ? "Guardado" : "Saved"} · {new Date(mockup.updated_at).toLocaleString(lang === "es" ? "es-ES" : "en-US")}
          </span>
          <div className="ml-auto flex gap-1.5 flex-wrap">
            <button
              onClick={openInTab}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-border-strong text-[11.5px] font-medium"
            >
              <ExternalLink size={12} strokeWidth={1.5} />
              {lang === "es" ? "Abrir en pestaña" : "Open in tab"}
            </button>
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-border-strong text-[11.5px] font-medium"
            >
              <Download size={12} strokeWidth={1.5} />
              {lang === "es" ? "Descargar" : "Download"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-accent hover:text-accent text-[11.5px] font-medium"
            >
              <RefreshCw size={12} strokeWidth={1.5} />
              {lang === "es" ? "Regenerar" : "Regenerate"}
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-2 border border-border hover:border-danger hover:text-danger text-[11.5px] font-medium"
            >
              <Trash2 size={12} strokeWidth={1.5} />
              {lang === "es" ? "Borrar" : "Delete"}
            </button>
          </div>
        </div>

        {confirmDel && (
          <div className="border border-danger rounded-lg bg-danger/5 p-3 flex items-center gap-3 text-[12.5px]">
            <span className="flex-1">{lang === "es" ? "¿Borrar este modelo?" : "Delete this mockup?"}</span>
            <button
              onClick={() => setConfirmDel(false)}
              className="px-3 h-8 rounded-md bg-bg-2 border border-border text-[12px]"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button
              onClick={deleteMockup}
              disabled={del.isPending}
              className="px-3 h-8 rounded-md bg-danger text-white text-[12px] font-semibold disabled:opacity-60"
            >
              {del.isPending ? (lang === "es" ? "Borrando…" : "Deleting…") : (lang === "es" ? "Sí, borrar" : "Yes, delete")}
            </button>
          </div>
        )}

        <iframe
          srcDoc={mockup.html}
          sandbox="allow-same-origin"
          className="w-full h-[640px] rounded-lg border border-border bg-white"
          title={`Mockup ${deal.company?.name ?? deal.title}`}
        />
      </div>
    );
  }

  // Estado A — Sin mockup o regenerando
  return (
    <div className="flex flex-col gap-5 max-w-[680px]">
      {/* Intro */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-soft/40 border border-accent/30">
        <FileCode size={20} className="text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <h3 className="text-[13.5px] font-semibold m-0">
            {lang === "es" ? "Genera un modelo de web premium con tu plan de Claude Code" : "Generate a premium web mockup with your Claude Code plan"}
          </h3>
          <p className="text-[12px] text-fg-1 mt-1 leading-relaxed">
            {lang === "es"
              ? "Copia el prompt, pégalo en Claude Code en una carpeta vacía, deja que la skill crear-web-premium genere el index.html, y luego pega el HTML aquí."
              : "Copy the prompt, paste it in Claude Code in an empty folder, let the crear-web-premium skill generate index.html, then paste the HTML here."}
          </p>
        </div>
      </div>

      {/* Step 1 — Copy prompt */}
      <div>
        <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
          {lang === "es" ? "1. Copia el prompt" : "1. Copy the prompt"}
        </div>
        <button
          onClick={copyPrompt}
          className={cn(
            "inline-flex items-center gap-2 px-4 h-10 rounded-lg font-semibold text-[13px] transition-colors",
            copying
              ? "bg-ok text-white"
              : "bg-accent text-accent-ink hover:brightness-105"
          )}
        >
          {copying ? <Check size={14} strokeWidth={2} /> : <Clipboard size={14} strokeWidth={1.8} />}
          {copying
            ? (lang === "es" ? "Copiado" : "Copied")
            : (lang === "es" ? "Copiar prompt para Claude Code" : "Copy prompt for Claude Code")}
        </button>
      </div>

      {/* Step 2 — Run locally */}
      <div>
        <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
          {lang === "es" ? "2. Ejecuta en Claude Code" : "2. Run in Claude Code"}
        </div>
        <ol className="text-[12.5px] text-fg-1 leading-relaxed pl-5 list-decimal space-y-1">
          <li>{lang === "es" ? "Abre una carpeta vacía en VSCode" : "Open an empty folder in VSCode"}</li>
          <li>{lang === "es" ? "Lanza Claude Code y pega el prompt" : "Launch Claude Code and paste the prompt"}</li>
          <li>{lang === "es" ? "Espera a que genere index.html (~1-2 min)" : "Wait for index.html to generate (~1-2 min)"}</li>
          <li>{lang === "es" ? "Copia todo el contenido del archivo" : "Copy the entire file contents"}</li>
        </ol>
      </div>

      {/* Step 3 — Paste HTML */}
      <div>
        <div className="text-[10.5px] font-semibold text-fg-2 uppercase tracking-[0.1em] mb-2">
          {lang === "es" ? "3. Pega el HTML aquí" : "3. Paste the HTML here"}
        </div>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="<!DOCTYPE html>&#10;<html>&#10;..."
          className="w-full h-[200px] rounded-lg bg-bg-2 border border-border px-3 py-2 text-[12px] font-mono outline-none focus:border-accent resize-y"
        />
        <div className="flex gap-2 mt-2">
          {editing && (
            <button
              onClick={() => { setEditing(false); setPasted(""); }}
              className="px-3 h-9 rounded-md bg-bg-2 border border-border text-[12.5px] font-medium hover:border-border-strong"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
          )}
          <button
            onClick={save}
            disabled={!pasted.trim() || upsert.isPending}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-accent-ink font-semibold text-[12.5px] hover:brightness-105 disabled:opacity-50"
          >
            {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {upsert.isPending
              ? (lang === "es" ? "Guardando…" : "Saving…")
              : (lang === "es" ? "Guardar modelo" : "Save mockup")}
          </button>
        </div>
      </div>
    </div>
  );
}

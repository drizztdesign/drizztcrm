#!/usr/bin/env node
/**
 * Drizzt CRM — Local mockup watcher.
 *
 * Listens on Supabase realtime for new pending mockup requests. When one
 * arrives, runs `claude` CLI locally (using your monthly plan, no API cost),
 * reads the generated index.html, uploads it back to Supabase. The CRM
 * polls deal_mockups and shows the iframe automatically.
 *
 * Usage:
 *   node scripts/mockup-watcher.mjs
 *
 * Requirements:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - `claude` CLI installed and in PATH
 */
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// Load .env.local from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

/** Run a child process and resolve when it exits. */
function runClaude(prompt, cwd) {
  return new Promise((resolve, reject) => {
    // Use shell:true on Windows because `claude` is a .cmd shim
    const proc = spawn(
      "claude",
      ["-p", prompt, "--dangerously-skip-permissions"],
      { cwd, shell: true, stdio: ["ignore", "inherit", "inherit"] }
    );
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
  });
}

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function processRow(row) {
  const { id, deal_id, prompt } = row;
  if (!prompt) {
    console.log(`  ⚠ Row ${id} has no prompt, skipping`);
    return;
  }

  console.log(`\n→ Procesando deal ${deal_id}…`);
  const startedAt = Date.now();

  const dir = path.join(tmpdir(), `drizzt-mockup-${deal_id}-${Date.now()}`);
  await mkdir(dir, { recursive: true });

  try {
    // Write the full prompt to a file in the work dir
    await writeFile(path.join(dir, "TASK.md"), prompt);

    // Short command — Claude reads the long task from the file
    const cmd = "Lee TASK.md y sigue todas las instrucciones para generar un archivo index.html en esta misma carpeta. NO escribas explicaciones, solo crea el archivo.";

    await runClaude(cmd, dir);

    // Read the generated HTML
    const htmlPath = path.join(dir, "index.html");
    if (!(await fileExists(htmlPath))) {
      throw new Error("claude no generó index.html");
    }
    const html = await readFile(htmlPath, "utf8");
    if (!html.trim()) throw new Error("index.html está vacío");

    // Upload back
    const { error } = await sb
      .from("deal_mockups")
      .update({ html, status: "done", prompt: null, error_msg: null })
      .eq("id", id);
    if (error) throw new Error(`supabase update: ${error.message}`);

    const took = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`✓ Mockup generado (${html.length} bytes) en ${took}s`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Error: ${msg}`);
    await sb
      .from("deal_mockups")
      .update({ status: "error", error_msg: msg })
      .eq("id", id);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function main() {
  console.log("Drizzt CRM — Mockup watcher");
  console.log("============================");

  // Process any pending requests already in the queue
  const { data: pending } = await sb
    .from("deal_mockups")
    .select("*")
    .eq("status", "pending");

  if (pending && pending.length > 0) {
    console.log(`\nHay ${pending.length} peticiones pendientes en cola. Procesando…`);
    for (const row of pending) {
      await processRow(row);
    }
  }

  // Subscribe to realtime changes
  sb.channel("mockup-watcher")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "deal_mockups" },
      (payload) => {
        const row = payload.new;
        if (row.status === "pending") {
          processRow(row).catch((e) => console.error("Unhandled:", e));
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "deal_mockups" },
      (payload) => {
        const row = payload.new;
        const old = payload.old;
        // Only process if transitioned TO pending (avoid loops when we update to done)
        if (row.status === "pending" && old?.status !== "pending") {
          processRow(row).catch((e) => console.error("Unhandled:", e));
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("\n✓ Watcher activo. Esperando peticiones de mockup…");
        console.log("  (Ctrl+C para salir)\n");
      }
    });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

// Keep alive
process.on("SIGINT", () => {
  console.log("\n\nCerrando watcher…");
  process.exit(0);
});

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildMockupPrompt } from "@/lib/mockup-prompt";
import type { DealWithRelations } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a premium web designer. You generate complete, self-contained, mobile-first HTML landing pages with embedded CSS, no frameworks, no external assets except Google Fonts and picsum.photos placeholders.

You output ONLY raw HTML. No markdown fences, no commentary, no explanations. The response must start with "<!DOCTYPE html>" and end with "</html>".`;

export async function POST(request: Request) {
  // Auth
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada. Añádela en .env.local y Vercel." },
      { status: 503 }
    );
  }

  // Body
  let body: { dealId?: string; lang?: "es" | "en" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }
  if (!body.dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  // Fetch deal with relations
  const { data: dealRow, error: dealErr } = await sb
    .from("deals")
    .select("*, company:companies(*), contact:contacts(*)")
    .eq("id", body.dealId)
    .single();
  if (dealErr || !dealRow) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }

  const prompt = buildMockupPrompt(dealRow as DealWithRelations, body.lang ?? "es");

  // Call Claude
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const html = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      // Strip markdown fences if Claude ignored instructions
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    if (!html.toLowerCase().startsWith("<!doctype html") && !html.toLowerCase().startsWith("<html")) {
      return NextResponse.json({ error: "model did not return valid HTML" }, { status: 502 });
    }

    // Upsert to deal_mockups
    const { error: upErr } = await sb
      .from("deal_mockups")
      .upsert(
        { deal_id: body.dealId, html, status: "done", prompt: null, error_msg: null },
        { onConflict: "deal_id" }
      );
    if (upErr) {
      return NextResponse.json({ error: `db error: ${upErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ html });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: `claude error: ${msg}` }, { status: 502 });
  }
}

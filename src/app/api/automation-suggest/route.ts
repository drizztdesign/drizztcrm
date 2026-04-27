import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYSTEM = `You convert a user's natural-language description of a CRM automation into a strict JSON object.

Output ONLY valid JSON with these exact keys (no markdown, no commentary):

{
  "name": "short imperative title (max 60 chars, in user's language)",
  "icon": "single emoji that fits the rule",
  "description_es": "1-line Spanish description",
  "description_en": "1-line English description",
  "trigger": { "kind": "...", ...params },
  "action":  { "kind": "...", ...params }
}

Allowed trigger kinds and their params:
  - { "kind": "noTouchFor", "days": <int>, "stage"?: "<stage>" }       // deals not touched for N days, optionally only in given stage
  - { "kind": "daysInStage", "days": <int>, "stage": "<stage>" }       // N+ days in a specific stage
  - { "kind": "stageAge", "days": <int> }                              // N+ days in any active stage
  - { "kind": "postStageEnter", "postStage": "<post>", "days"?: <int> } // post_stage matches; days optional age
  - { "kind": "tempIs", "temp": "superhot|hot|warm|cold|lost" }
  - { "kind": "tagContains", "tag": "<string>" }
  - { "kind": "sourceIn", "values": ["<source>", ...] }
  - { "kind": "priceMin", "min": <number> }
  - { "kind": "daysSinceCreated", "days": <int>, "stage"?: "<stage>" }

Allowed action kinds and their params:
  - { "kind": "markUrgent" }
  - { "kind": "moveStage", "stage": "<stage>" }
  - { "kind": "createTask", "taskKind": "call|whatsapp|email|meeting|note|proposal|payment", "taskTitle": "<string>" }
  - { "kind": "appendTimeline" }
  - { "kind": "adjustProbability" }
  - { "kind": "setTemp", "temp": "superhot|hot|warm|cold|lost" }
  - { "kind": "addTag", "tag": "<string>" }
  - { "kind": "removeTag", "tag": "<string>" }

Allowed stage values: lead, contactado, interesado, reunion, propuesta, negociacion, cerrado, lost
Allowed post_stage values: desarrollo, revision, entregada, mantenimiento, finalizado, recurrente
Allowed source values: web, instagram, referido, google, email_frio, llamada, networking, cliente_ant, linkedin

Pick the trigger/action that BEST matches the user's intent. If days are not specified, infer a reasonable default. If something is impossible to express with the schema, pick the closest available combination.`;

export async function POST(request: Request) {
  // Auth check
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to your .env.local and Vercel env vars." },
      { status: 503 }
    );
  }

  let body: { prompt?: string; lang?: "es" | "en" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "empty prompt" }, { status: 400 });
  if (prompt.length > 500) return NextResponse.json({ error: "prompt too long" }, { status: 400 });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [
        { role: "user", content: `User language: ${body.lang === "en" ? "English" : "Spanish"}.\n\nDescription: ${prompt}` },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // Strip optional markdown fences
    const jsonText = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonText);
    return NextResponse.json({ suggestion: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: `failed to parse: ${msg}` }, { status: 502 });
  }
}

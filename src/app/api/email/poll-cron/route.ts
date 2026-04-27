import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Wrapper hit by Vercel Cron. Verifies the Authorization header matches
 * CRON_SECRET (Vercel auto-attaches `Authorization: Bearer ${CRON_SECRET}`)
 * and forwards to /api/email/poll which contains the real logic.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${url.origin}/api/email/poll?secret=${encodeURIComponent(process.env.CRON_SECRET)}`;
  const r = await fetch(target);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json({ ok: r.ok, status: r.status, data });
}

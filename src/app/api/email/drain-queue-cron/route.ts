import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const target = `${url.origin}/api/email/drain-queue?secret=${encodeURIComponent(process.env.CRON_SECRET)}`;
  const r = await fetch(target);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json({ ok: r.ok, status: r.status, data });
}

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { emailEnv, buildRefToken, refTokenInSubject, fillTemplate } from "@/lib/email/config";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Drains pending entries from email_send_queue and actually sends them.
 * Triggered by:
 *   - Vercel cron (every 5 min): /api/email/drain-queue-cron forwards here
 *   - Manual: GET ?secret=<CRON_SECRET>
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = emailEnv();
  if (!env.configured) return NextResponse.json({ error: "Gmail not configured" }, { status: 503 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "service role missing" }, { status: 503 });
  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  // Pull up to 25 pending entries
  const { data: queue, error: qErr } = await sb
    .from("email_send_queue")
    .select("id, owner_id, deal_id, template_id, automation_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25);
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 502 });
  if (!queue || queue.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.user, pass: env.pass },
  });

  let sent = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      // Load deal + contact + company + template
      const { data: deal } = await sb
        .from("deals")
        .select("id, code, title, price_estimated, contact:contacts(id,name,email,phone), company:companies(name,city,sector,website)")
        .eq("id", item.deal_id)
        .single();
      if (!deal) throw new Error("deal not found");

      // deal.contact is an array via PostgREST embedding
      type Contact = { id: string; name?: string | null; email?: string | null; phone?: string | null };
      type Company = { name?: string | null; city?: string | null; sector?: string | null; website?: string | null };
      const dealRecord = deal as unknown as { id: string; code: string; title: string; price_estimated: number; contact: Contact | null; company: Company | null };
      const contact = dealRecord.contact;
      const company = dealRecord.company;
      const toAddr = (contact?.email ?? "").trim();
      if (!toAddr) throw new Error("contact has no email");

      // Pick template body. If no templateId given, send a basic fallback.
      let subject = "Hola desde DRIZZT";
      let body = "Hola,\n\nTe escribo desde DRIZZT DESIGN.\n\nUn saludo,\nDrizzt";
      if (item.template_id) {
        const { data: tpl } = await sb
          .from("templates")
          .select("subject, body")
          .eq("id", item.template_id)
          .single();
        if (tpl) {
          subject = tpl.subject || subject;
          body = tpl.body || body;
        }
      }

      const vars: Record<string, string> = {
        contacto: contact?.name ?? "",
        empresa: company?.name ?? "",
        web: company?.website ?? "",
        sector: company?.sector ?? "",
        ciudad: company?.city ?? "",
        presupuesto: String(dealRecord.price_estimated ?? ""),
        telefono: contact?.phone ?? "",
      };
      const finalSubject = fillTemplate(subject, vars);
      const finalBody = fillTemplate(body, vars);

      const refToken = buildRefToken();
      const taggedSubject = refTokenInSubject(finalSubject, refToken);
      const html = finalBody
        .split("\n")
        .map((l) => l.length === 0 ? "<br>" : `<p style="margin:0 0 8px 0">${escapeHtml(l)}</p>`)
        .join("");

      const info = await transporter.sendMail({
        from: `"${env.fromName}" <${env.user}>`,
        to: toAddr,
        subject: taggedSubject,
        text: finalBody,
        html,
      });

      // Persist to email_messages
      await sb.from("email_messages").insert({
        owner_id: item.owner_id,
        deal_id: item.deal_id,
        contact_id: contact?.id ?? null,
        direction: "out",
        ref_token: refToken,
        from_addr: env.user,
        to_addr: toAddr,
        subject: taggedSubject,
        body_text: finalBody,
        body_html: html,
        message_id: info.messageId ?? null,
        template_id: item.template_id ?? null,
      });

      // Timeline event
      await sb.from("timeline_events").insert({
        owner_id: item.owner_id,
        deal_id: item.deal_id,
        kind: "email",
        who: env.fromName,
        body: `📧 ${taggedSubject}\n\n${finalBody.slice(0, 240)}${finalBody.length > 240 ? "…" : ""}`,
        t: "Automático",
        occurred_at: new Date().toISOString(),
      });
      await sb.from("deals").update({ last_touch: new Date().toISOString() }).eq("id", item.deal_id);

      // Mark queue row as sent
      await sb
        .from("email_send_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", item.id);
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      await sb
        .from("email_send_queue")
        .update({ status: "failed", error: message })
        .eq("id", item.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

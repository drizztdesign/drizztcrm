import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { emailEnv, buildRefToken, refTokenInSubject, sanitizeSubject, fillTemplate } from "@/lib/email/config";

export const runtime = "nodejs";

interface SendEmailBody {
  to: string;
  subject: string;
  body: string;             // plain text or markdown-style. We send as text + HTML (line-break preserved)
  dealId?: string | null;
  contactId?: string | null;
  templateId?: string | null;
  vars?: Record<string, string>;
}

export async function POST(request: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const env = emailEnv();
  if (!env.configured) {
    return NextResponse.json(
      { error: "Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars." },
      { status: 503 }
    );
  }

  let body: SendEmailBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  if (!body.to || !body.subject || !body.body) {
    return NextResponse.json({ error: "to/subject/body required" }, { status: 400 });
  }

  // Fill placeholders if requested
  const rawSubject = body.vars ? fillTemplate(body.subject, body.vars) : body.subject;
  const text = body.vars ? fillTemplate(body.body, body.vars) : body.body;

  // Strip Re:/Fwd: prefixes — they trigger spam filters on cold outreach
  const cleanSubject = sanitizeSubject(rawSubject);

  const refToken = buildRefToken();
  const finalSubject = refTokenInSubject(cleanSubject, refToken);

  // Build proper HTML email (improves deliverability significantly)
  const bodyHtml = text
    .split("\n")
    .map((l) =>
      l.length === 0
        ? `<tr><td style="height:10px"></td></tr>`
        : `<tr><td style="margin:0;padding:0 0 10px 0;font-size:15px;line-height:1.7;color:#1a1a1a">${escapeHtml(l)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(cleanSubject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
          <tbody>
            ${bodyHtml}
          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.user, pass: env.pass },
  });

  let messageId: string | undefined;
  try {
    const info = await transporter.sendMail({
      from: `"${env.fromName}" <${env.user}>`,
      to: body.to,
      replyTo: `"${env.fromName}" <${env.user}>`,
      subject: finalSubject,
      text,
      html,
      headers: {
        "X-Mailer": "Drizzt CRM",
        "X-Priority": "3",           // Normal priority (1=high triggers spam)
        "Precedence": "bulk",
        "X-CRM-Ref": refToken,       // Machine-readable ref (doesn't appear in subject visually)
      },
    });
    messageId = info.messageId;
  } catch (err) {
    return NextResponse.json(
      { error: `SMTP failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 }
    );
  }

  // Persist to email_messages
  const { error: insErr } = await sb.from("email_messages").insert({
    owner_id: user.id,
    deal_id: body.dealId ?? null,
    contact_id: body.contactId ?? null,
    direction: "out",
    ref_token: refToken,
    from_addr: env.user,
    to_addr: body.to,
    subject: finalSubject,
    body_text: text,
    body_html: html,
    message_id: messageId ?? null,
    template_id: body.templateId ?? null,
  });
  if (insErr) {
    // Email already sent — log but don't block response
    console.error("email_messages insert failed:", insErr.message);
  }

  // Log to deal timeline
  if (body.dealId) {
    await sb.from("timeline_events").insert({
      owner_id: user.id,
      deal_id: body.dealId,
      kind: "email",
      who: env.fromName,
      body: `📧 ${finalSubject}\n\n${text.slice(0, 240)}${text.length > 240 ? "…" : ""}`,
      t: "Ahora",
      occurred_at: new Date().toISOString(),
    });
    await sb.from("deals").update({ last_touch: new Date().toISOString() }).eq("id", body.dealId);
  }

  return NextResponse.json({ ok: true, refToken, messageId });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

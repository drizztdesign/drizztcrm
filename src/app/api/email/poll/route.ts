import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { emailEnv, REF_RE } from "@/lib/email/config";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Polls the configured Gmail inbox for new replies and writes them to email_messages.
 * Match strategy:
 *   1. ref_token in Subject ([#XXXXXXXX]) → find sent message → take its deal_id/contact_id
 *   2. fallback: From email → contacts.email lookup
 *
 * Designed to be called by a cron job (e.g. /api/email/poll?secret=...).
 * Uses the SERVICE ROLE key because the cron has no user session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = emailEnv();
  if (!env.configured) {
    return NextResponse.json({ error: "Gmail not configured" }, { status: 503 });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  }
  const sb = createServiceClient(supaUrl, serviceKey);

  // We don't know which user the inbox belongs to (single-tenant CRM = always one user).
  // Resolve it from email_messages: pick the most recent owner_id we sent from this address.
  const { data: lastSent } = await sb
    .from("email_messages")
    .select("owner_id")
    .eq("direction", "out")
    .eq("from_addr", env.user)
    .order("sent_at", { ascending: false })
    .limit(1);
  const ownerId = lastSent?.[0]?.owner_id;
  if (!ownerId) {
    // No prior outbound — nothing to thread replies to. Still returns 200 to keep cron healthy.
    return NextResponse.json({ ok: true, note: "no prior outbound, skipping" });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: env.user, pass: env.pass },
    logger: false,
  });

  let processed = 0;
  let matched = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Look at messages from the last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const searchResult = await client.search({ since });
      const uids: number[] = Array.isArray(searchResult) ? searchResult : [];

      for (const uid of uids) {
        const msg = await client.fetchOne(uid, { source: true, envelope: true });
        if (!msg || !msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const messageId = parsed.messageId;
        if (!messageId) continue;

        // Skip if already stored
        const { data: existing } = await sb
          .from("email_messages")
          .select("id")
          .eq("owner_id", ownerId)
          .eq("message_id", messageId)
          .limit(1);
        if (existing && existing.length) continue;

        // Skip emails we sent (loopback)
        const fromAddr = (parsed.from?.value?.[0]?.address ?? "").toLowerCase();
        if (fromAddr === env.user.toLowerCase()) continue;

        const subject = parsed.subject ?? "";
        const text = parsed.text ?? "";
        const html = parsed.html === false ? "" : (parsed.html ?? "");
        const inReplyTo = parsed.inReplyTo ?? null;

        // Try to match ref_token from subject
        const m = REF_RE.exec(subject);
        let dealId: string | null = null;
        let contactId: string | null = null;
        let refToken = m?.[1]?.toUpperCase() ?? "";

        if (refToken) {
          const { data: orig } = await sb
            .from("email_messages")
            .select("deal_id,contact_id,ref_token")
            .eq("owner_id", ownerId)
            .eq("ref_token", refToken)
            .limit(1);
          if (orig?.[0]) {
            dealId = orig[0].deal_id;
            contactId = orig[0].contact_id;
          }
        }

        // Fallback: find contact by email
        if (!contactId && fromAddr) {
          const { data: contacts } = await sb
            .from("contacts")
            .select("id")
            .eq("owner_id", ownerId)
            .ilike("email", fromAddr)
            .limit(1);
          if (contacts?.[0]) contactId = contacts[0].id;
        }
        // If no deal but found contact: try most recent deal of that contact
        if (!dealId && contactId) {
          const { data: deals } = await sb
            .from("deals")
            .select("id")
            .eq("owner_id", ownerId)
            .eq("contact_id", contactId)
            .order("last_touch", { ascending: false })
            .limit(1);
          if (deals?.[0]) dealId = deals[0].id;
        }

        if (!refToken) refToken = "INBOUND";

        await sb.from("email_messages").insert({
          owner_id: ownerId,
          deal_id: dealId,
          contact_id: contactId,
          direction: "in",
          ref_token: refToken,
          from_addr: fromAddr,
          to_addr: env.user,
          subject,
          body_text: text,
          body_html: typeof html === "string" ? html : "",
          message_id: messageId,
          in_reply_to: inReplyTo,
        });
        processed++;

        if (dealId) {
          matched++;
          // Add timeline event
          await sb.from("timeline_events").insert({
            owner_id: ownerId,
            deal_id: dealId,
            kind: "email",
            who: parsed.from?.value?.[0]?.name || fromAddr,
            body: `↩ ${subject}\n\n${text.slice(0, 400)}${text.length > 400 ? "…" : ""}`,
            t: "Ahora",
            occurred_at: new Date().toISOString(),
          });
          // Advance stage if currently in 'contactado' or 'lead' — they replied, so they're at least 'interesado'
          const { data: deal } = await sb.from("deals").select("stage").eq("id", dealId).single();
          if (deal && (deal.stage === "contactado" || deal.stage === "lead")) {
            await sb
              .from("deals")
              .update({
                stage: "interesado",
                stage_entered_at: new Date().toISOString(),
                last_touch: new Date().toISOString(),
                next_action_status: "urgent",
              })
              .eq("id", dealId);
          } else {
            await sb.from("deals").update({ last_touch: new Date().toISOString() }).eq("id", dealId);
          }
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    return NextResponse.json(
      { error: `IMAP failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, processed, matched });
}

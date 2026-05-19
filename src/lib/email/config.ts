// Centralized helpers for email config + ref-token generation.

export function emailEnv() {
  const user = process.env.GMAIL_USER ?? "";
  const pass = process.env.GMAIL_APP_PASSWORD ?? "";
  const fromName = process.env.GMAIL_FROM_NAME ?? "DRIZZT DESIGN";
  return { user, pass, fromName, configured: !!user && !!pass };
}

export function buildRefToken(): string {
  // 8-char base32-ish token, easy to type, hard to collide
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function sanitizeSubject(subject: string): string {
  // Strip leading Re:/RE:/Fwd: prefixes — they trigger spam filters on cold outreach
  return subject.replace(/^(re|fwd?|fw):\s*/i, "").trim();
}

export function refTokenInSubject(subject: string, token: string): string {
  // Append tracking token at end. Strip any previous token first.
  const clean = subject.replace(/\s+\[#[A-Z0-9]{6,12}\]\s*$/i, "").trim();
  return `${clean} [#${token}]`;
}

export const REF_RE = /\[#([A-Z0-9]{6,12})\]/i;

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

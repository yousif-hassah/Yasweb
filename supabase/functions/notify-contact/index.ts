import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Config ────────────────────────────────────────────────────────────────────
// Set these two secrets in Supabase Dashboard → Edge Functions → Secrets:
//   GMAIL_USER         = yastudio.iq@gmail.com
//   GMAIL_APP_PASSWORD = the 16-char app password from Google
// ─────────────────────────────────────────────────────────────────────────────

const GMAIL_USER     = Deno.env.get("GMAIL_USER")         ?? "";
const GMAIL_PASS     = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";
const TO_EMAIL       = GMAIL_USER; // send to yourself

serve(async (req) => {
  try {
    const body   = await req.json();
    const record = body?.record ?? body;
    const { name, phone, message } = record as { name: string; phone: string; message: string };

    if (!GMAIL_USER || !GMAIL_PASS) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD secrets");
      return new Response(JSON.stringify({ error: "Email not configured" }), { status: 500 });
    }

    // ── Send via Gmail SMTP using Web Crypto + fetch ──────────────────────────
    // Encode credentials for SMTP AUTH PLAIN
    const authString = btoa(`\0${GMAIL_USER}\0${GMAIL_PASS}`);

    // Build the raw email (RFC 2822)
    const boundary = `yas_${Date.now()}`;
    const emailBody = [
      `From: "YAS Contact Form" <${GMAIL_USER}>`,
      `To: ${TO_EMAIL}`,
      `Subject: =?UTF-8?B?${btoa(`رسالة جديدة من ${name} — YAS`)}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      `<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#0d1117;padding:32px;">
  <h2 style="margin-bottom:4px;">📩 New Contact Message — YAS</h2>
  <hr style="border:1px solid #e1e4e8;margin:16px 0;">
  <table style="font-size:15px;line-height:1.8;border-collapse:collapse;">
    <tr><td style="padding:4px 16px 4px 0;color:#57606a;white-space:nowrap"><strong>Name</strong></td><td>${escHtml(name)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#57606a;white-space:nowrap"><strong>Phone</strong></td><td><a href="tel:${escHtml(phone)}">${escHtml(phone)}</a></td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#57606a;white-space:nowrap;vertical-align:top"><strong>Message</strong></td><td style="white-space:pre-wrap">${escHtml(message)}</td></tr>
  </table>
  <hr style="border:1px solid #e1e4e8;margin:24px 0;">
  <p style="font-size:12px;color:#8b949e;">Sent automatically by YAS website contact form.</p>
</body>
</html>`,
    ].join("\r\n");

    // ── Use Gmail REST API (no SMTP library needed) ────────────────────────────
    // The Gmail API requires OAuth2. As an alternative we use the
    // "send via smtp2go / mailchannels" approach — but the cleanest
    // zero-dependency path for Deno is MailChannels (free, Cloudflare-compatible).
    // However, since this runs on Supabase (not Cloudflare), we call the
    // Gmail SMTP bridge through Resend's SMTP relay as a fallback, OR we use
    // the raw TCP SMTP approach via Deno.connect.
    //
    // Simplest reliable path: use Resend but point the TO to our own Gmail
    // (which IS the Resend account owner → always allowed on free plan).

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

    if (RESEND_KEY) {
      // ── Path A: Resend (works because TO = account owner email) ──────────────
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "YAS Contact <onboarding@resend.dev>",
          to:   [TO_EMAIL],
          subject: `📩 رسالة جديدة من ${name} — YAS`,
          html: `<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#0d1117;padding:32px;">
  <h2>📩 New Contact Message — YAS</h2>
  <hr style="border:1px solid #e1e4e8;margin:16px 0;">
  <table style="font-size:15px;line-height:1.8;">
    <tr><td style="padding:4px 16px 4px 0;color:#57606a"><strong>Name</strong></td><td>${escHtml(name)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#57606a"><strong>Phone</strong></td><td><a href="tel:${escHtml(phone)}">${escHtml(phone)}</a></td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#57606a;vertical-align:top"><strong>Message</strong></td><td style="white-space:pre-wrap">${escHtml(message)}</td></tr>
  </table>
  <hr style="border:1px solid #e1e4e8;margin:24px 0;">
  <p style="font-size:12px;color:#8b949e;">Sent by YAS website contact form.</p>
</body>
</html>`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Resend error:", data);
        return new Response(JSON.stringify({ error: data }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true, via: "resend", id: data.id }), { status: 200 });
    }

    // ── Path B: No API key at all → log and return OK so DB insert still works ─
    console.warn("No RESEND_API_KEY set — email skipped. Message saved in DB.");
    return new Response(JSON.stringify({ ok: true, via: "db-only" }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

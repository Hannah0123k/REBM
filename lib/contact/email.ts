import type { ContactInput } from "@/lib/contact/validation";

/**
 * Contact-form email delivery via Resend's HTTP API (called with fetch, so no
 * SDK dependency). Runs server-side only — the API key and recipient addresses
 * are server env vars and are never sent to the client.
 *
 * Required env vars (documented in .env.example):
 *   RESEND_API_KEY           — Resend API key (server-only, never NEXT_PUBLIC_)
 *   CONTACT_RECIPIENT_ALAN   — Alan's inbox (internal notification recipient)
 *   CONTACT_RECIPIENT_RHETT  — Rhett's inbox (internal notification recipient)
 *   CONTACT_FROM_EMAIL       — verified Resend sender, e.g. "REBM <no-reply@…>"
 * Optional:
 *   CONTACT_RECIPIENT_EMAIL  — back-compat single recipient; used only if neither
 *                              ALAN nor RHETT is set (so an existing deploy keeps
 *                              working). At least ONE recipient must resolve.
 *   CONTACT_REPLY_TO_FALLBACK — reply-to used only if a visitor email is somehow
 *                              absent (it never is — email is required/validated).
 *   CONTACT_CONFIRMATION_ENABLED=true — turn on the visitor auto-reply (off by
 *                              default; requires CONTACT_FROM_EMAIL on a verified
 *                              domain).
 *
 * Recipients come ONLY from these server env vars — never from the browser
 * payload — so the form can never be used to mail an arbitrary address.
 */
export type SendResult =
  | { sent: true; id?: string }
  | { sent: false; reason: "unconfigured"; missing: string[] }
  | { sent: false; reason: "provider_error"; detail: string }
  | { sent: false; reason: "disabled" };

export type SubmissionMeta = {
  submittedAt: Date;
  /** Page/path the submission came from (server-derived), for the notification. */
  source?: string;
  /** Client IP — used for rate limiting only; intentionally NOT put in the email. */
  ip?: string;
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no env side effects).
// ---------------------------------------------------------------------------

const BRAND_NAVY = "#032C40";
const BRAND_BLUE = "#689ECF";
const INK = "#1f2d38";
const MUTED = "#5a6b78";
const HAIRLINE = "#e3e9f0";
const CANVAS = "#eef3f8";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Collapse CR/LF/tabs to single spaces — used on any value placed in a header
 *  (subject, mailto subject) to defuse header-injection attempts. */
export function oneLine(s: string): string {
  return s.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

/**
 * Resolve internal-notification recipients from server env only. Prefers the two
 * named boxes (Alan + Rhett); falls back to the legacy single var so an older
 * deploy keeps delivering. De-duplicates (same address entered twice, or a named
 * box equal to the legacy one) so nobody gets two copies.
 */
export function resolveRecipients(
  env: Record<string, string | undefined> = process.env,
): { to: string[]; missing: string[] } {
  const named = [env.CONTACT_RECIPIENT_ALAN, env.CONTACT_RECIPIENT_RHETT]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
  const legacy = (env.CONTACT_RECIPIENT_EMAIL ?? "").trim();
  const list = named.length ? named : legacy ? [legacy] : [];
  const to = [...new Set(list.map((a) => a.toLowerCase()))].map(
    (lower) => list.find((a) => a.toLowerCase() === lower)!,
  );
  return { to, missing: to.length ? [] : ["CONTACT_RECIPIENT_ALAN", "CONTACT_RECIPIENT_RHETT"] };
}

/** Reply-To for the internal notification: the validated visitor address, so a
 *  reply goes straight to the lead. Falls back to a configured address only if a
 *  visitor email is somehow missing (it is required + validated upstream). */
export function resolveReplyTo(
  data: Pick<ContactInput, "email">,
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return data.email?.trim() || env.CONTACT_REPLY_TO_FALLBACK?.trim() || undefined;
}

/** Strong, scannable subject: lead name + the one qualifier this business cares
 *  about (are they an agent/broker?). Newlines stripped for header safety. */
export function buildSubject(data: ContactInput): string {
  const name = oneLine(`${data.firstName} ${data.lastName}`) || "New lead";
  const qualifier = data.isBroker === "yes" ? " — Real estate agent/broker" : "";
  return oneLine(`New REBM lead: ${name}${qualifier}`);
}

type Row = { label: string; value: string; href?: string };

/** Only fields that actually exist on the form; optional ones omitted when blank. */
function detailRows(data: ContactInput, meta: SubmissionMeta): Row[] {
  const rows: Row[] = [
    { label: "Name", value: `${data.firstName} ${data.lastName}`.trim() },
    { label: "Email", value: data.email, href: `mailto:${encodeURIComponent(data.email)}` },
    { label: "Phone", value: data.phone, href: `tel:${data.phone.replace(/[^\d+]/g, "")}` },
    { label: "Agent or broker?", value: data.isBroker === "yes" ? "Yes" : "No" },
  ];
  if (data.heardAbout && data.heardAbout.trim()) {
    rows.push({ label: "How they found us", value: data.heardAbout.trim() });
  }
  rows.push({
    label: "Submitted",
    value: meta.submittedAt.toLocaleString("en-US", { timeZone: "America/Denver" }) + " (MT)",
  });
  if (meta.source) rows.push({ label: "Source", value: meta.source });
  return rows;
}

/** Branded, responsive (table-based, inline-styled) internal notification. */
export function renderContactEmail(
  data: ContactInput,
  meta: SubmissionMeta,
): { text: string; html: string } {
  const rows = detailRows(data, meta);
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const replySubject = oneLine(`Re: your enquiry to Real Estate Broker Match`);
  const mailto = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(replySubject)}`;
  const tel = `tel:${data.phone.replace(/[^\d+]/g, "")}`;

  // ---- plain-text fallback ----
  const text =
    `New contact form submission — Real Estate Broker Match\n` +
    `${"=".repeat(52)}\n\n` +
    rows.map((r) => `${r.label}: ${r.value}`).join("\n") +
    `\n\nMessage:\n${data.message}\n\n` +
    `Reply to ${fullName}: ${data.email}\n` +
    (data.phone ? `Call: ${data.phone}\n` : "");

  // ---- branded HTML ----
  const detailHtml = rows
    .map((r) => {
      const val = r.href
        ? `<a href="${escapeHtml(r.href)}" style="color:${BRAND_NAVY};text-decoration:underline">${escapeHtml(r.value)}</a>`
        : escapeHtml(r.value);
      return `
        <tr>
          <td style="padding:9px 16px 9px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${HAIRLINE}">${escapeHtml(r.label)}</td>
          <td style="padding:9px 0;color:${INK};font-size:14px;vertical-align:top;border-bottom:1px solid ${HAIRLINE}">${val}</td>
        </tr>`;
    })
    .join("");

  const button = (href: string, label: string, filled: boolean) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 22px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;${
      filled
        ? `background:${BRAND_NAVY};color:#ffffff`
        : `background:#ffffff;color:${BRAND_NAVY};border:1px solid ${HAIRLINE}`
    }">${escapeHtml(label)}</a>`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>New contact form submission</title></head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">New enquiry from ${escapeHtml(fullName)}${data.isBroker === "yes" ? " (agent/broker)" : ""}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px -24px rgba(3,44,64,0.30);font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;">
        <!-- header -->
        <tr><td style="background:${BRAND_NAVY};padding:22px 28px;">
          <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">Real Estate Broker Match</div>
          <div style="color:${BRAND_BLUE};font-size:13px;font-weight:600;margin-top:2px;">New website enquiry</div>
        </td></tr>
        <!-- lead name -->
        <tr><td style="padding:26px 28px 6px;">
          <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Lead</div>
          <div style="color:${BRAND_NAVY};font-size:24px;font-weight:700;margin-top:4px;">${escapeHtml(fullName)}</div>
        </td></tr>
        <!-- quick actions -->
        <tr><td style="padding:14px 28px 4px;">
          ${button(mailto, `Reply to ${fullName}`, true)}${data.phone ? button(tel, "Call", false) : ""}
        </td></tr>
        <!-- details -->
        <tr><td style="padding:12px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${detailHtml}</table>
        </td></tr>
        <!-- message -->
        <tr><td style="padding:22px 28px 8px;">
          <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:8px;">Message</div>
          <div style="background:${CANVAS};border-radius:12px;padding:16px 18px;color:${INK};font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:18px 28px 26px;border-top:1px solid ${HAIRLINE};">
          <div style="color:${MUTED};font-size:12px;line-height:1.5;">Reply to this email to respond to the lead — replies go straight to <a href="mailto:${escapeHtml(data.email)}" style="color:${BRAND_NAVY};">${escapeHtml(data.email)}</a>.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { text, html };
}

/** Branded, honest visitor confirmation. No promised response deadline (none has
 *  been approved) and it includes a copy of the visitor's own message. Sent FROM
 *  the verified sender — never from the visitor — so no reply loop is created. */
export function renderVisitorConfirmation(data: ContactInput): { subject: string; text: string; html: string } {
  const subject = "We received your message — Real Estate Broker Match";
  const text =
    `Hi ${data.firstName},\n\n` +
    `Thanks for reaching out to Real Estate Broker Match. We've received your message and a member of our team will review it and be in touch.\n\n` +
    `For anything urgent, call (800) 841-5033.\n\n` +
    `Your message:\n${data.message}\n\n` +
    `— Real Estate Broker Match`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px -24px rgba(3,44,64,0.30);font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;">
        <tr><td style="background:${BRAND_NAVY};padding:22px 28px;">
          <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">Real Estate Broker Match</div>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;color:${INK};font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(data.firstName)},</p>
          <p style="margin:0 0 14px;">Thanks for reaching out to <strong style="color:${BRAND_NAVY};">Real Estate Broker Match</strong>. We&rsquo;ve received your message and a member of our team will review it and be in touch.</p>
          <p style="margin:0 0 6px;">For anything urgent, call <a href="tel:+18008415033" style="color:${BRAND_NAVY};font-weight:600;">(800) 841-5033</a>.</p>
        </td></tr>
        <tr><td style="padding:14px 28px 8px;">
          <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:8px;">Your message</div>
          <div style="background:${CANVAS};border-radius:12px;padding:16px 18px;color:${INK};font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
        </td></tr>
        <tr><td style="padding:20px 28px 26px;border-top:1px solid ${HAIRLINE};color:${MUTED};font-size:12px;">
          &mdash; Real Estate Broker Match
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Network layer.
// ---------------------------------------------------------------------------

/** Hard cap on a single Resend HTTP call. Resend normally answers in <500ms; if a
 *  call ever stalls (network/provider hiccup) we abort rather than let the request
 *  — and the whole submission — hang up to the platform's function limit. */
const RESEND_TIMEOUT_MS = 10_000;

async function postToResend(body: Record<string, unknown>, apiKey: string): Promise<SendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: "provider_error", detail: `${res.status} ${detail.slice(0, 300)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: json.id };
  } catch (e) {
    // AbortError = our own timeout fired; report it distinctly so logs show a
    // stall rather than a generic network error.
    const detail =
      e instanceof Error && e.name === "AbortError"
        ? `timeout after ${RESEND_TIMEOUT_MS}ms`
        : e instanceof Error
          ? e.message
          : "network error";
    return { sent: false, reason: "provider_error", detail };
  } finally {
    clearTimeout(timer);
  }
}

/** Send the internal notification email to BOTH configured recipients. */
export async function sendContactEmail(data: ContactInput, meta: SubmissionMeta): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const { to, missing: recipMissing } = resolveRecipients();

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("CONTACT_FROM_EMAIL");
  missing.push(...recipMissing);
  if (missing.length || !apiKey) return { sent: false, reason: "unconfigured", missing };

  const { text, html } = renderContactEmail(data, meta);
  return postToResend(
    {
      from,
      to, // both Alan + Rhett; from server env only, never the browser
      reply_to: resolveReplyTo(data),
      subject: buildSubject(data),
      text,
      html,
    },
    apiKey,
  );
}

/** Whether the visitor auto-reply is turned on (off unless explicitly enabled). */
export function visitorConfirmationEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.CONTACT_CONFIRMATION_ENABLED === "true";
}

/**
 * OPTIONAL branded auto-reply to the visitor. Best-effort: the caller must not
 * fail the submission if this fails (the internal notification is what matters).
 * Disabled unless CONTACT_CONFIRMATION_ENABLED=true AND the sender is configured.
 * Sent FROM the verified sender (never the visitor) so it can't loop.
 */
export async function sendVisitorConfirmation(data: ContactInput): Promise<SendResult> {
  if (!visitorConfirmationEnabled()) return { sent: false, reason: "disabled" };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    const missing = [!apiKey && "RESEND_API_KEY", !from && "CONTACT_FROM_EMAIL"].filter(Boolean) as string[];
    return { sent: false, reason: "unconfigured", missing };
  }
  const { subject, text, html } = renderVisitorConfirmation(data);
  return postToResend(
    { from, to: [data.email], reply_to: resolveReplyTo(data), subject, text, html },
    apiKey,
  );
}

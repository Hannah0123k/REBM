import type { ContactInput } from "@/lib/contact/validation";

/**
 * Contact-form email delivery via Resend's HTTP API (called with fetch, so no
 * SDK dependency). Runs server-side only — the API key is a server env var and
 * is never sent to the client.
 *
 * Required env vars (see the report / README):
 *   RESEND_API_KEY          — Resend API key (server-only, never NEXT_PUBLIC_)
 *   CONTACT_RECIPIENT_EMAIL — where submissions are delivered (the business)
 *   CONTACT_FROM_EMAIL      — verified Resend sender, e.g. "REBM <no-reply@…>"
 *
 * If any are missing the send is a no-op that reports `unconfigured` (with the
 * missing names) so the action can return a safe message and log what to add.
 */
export type SendResult =
  | { sent: true }
  | { sent: false; reason: "unconfigured"; missing: string[] }
  | { sent: false; reason: "provider_error"; detail: string }
  | { sent: false; reason: "disabled" };

export type SubmissionMeta = { submittedAt: Date; ip?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fields(data: ContactInput, meta: SubmissionMeta): [string, string][] {
  return [
    ["Name", `${data.firstName} ${data.lastName}`],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Company / Brokerage", data.company || "—"],
    ["Agent or broker?", data.isBroker === "yes" ? "Yes" : "No"],
    ["Submitted", meta.submittedAt.toLocaleString("en-US", { timeZone: "America/Denver" }) + " (MT)"],
  ];
}

function renderContactEmail(data: ContactInput, meta: SubmissionMeta): { text: string; html: string } {
  const rows = fields(data, meta);
  const text =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nMessage:\n${data.message}\n`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#032C40;max-width:640px">
      <h2 style="margin:0 0 16px">New contact form submission</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#5a6b78;white-space:nowrap;vertical-align:top">${escapeHtml(
                k,
              )}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <h3 style="margin:20px 0 6px">Message</h3>
      <p style="white-space:pre-wrap;font-size:14px;line-height:1.5;margin:0">${escapeHtml(
        data.message,
      )}</p>
    </div>`;
  return { text, html };
}

async function postToResend(body: Record<string, unknown>, apiKey: string): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: "provider_error", detail: `${res.status} ${detail.slice(0, 300)}` };
    }
    return { sent: true };
  } catch (e) {
    return {
      sent: false,
      reason: "provider_error",
      detail: e instanceof Error ? e.message : "network error",
    };
  }
}

/** Send the internal notification email to the business. */
export async function sendContactEmail(data: ContactInput, meta: SubmissionMeta): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_RECIPIENT_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!to) missing.push("CONTACT_RECIPIENT_EMAIL");
  if (!from) missing.push("CONTACT_FROM_EMAIL");
  if (missing.length || !apiKey) return { sent: false, reason: "unconfigured", missing };

  const { text, html } = renderContactEmail(data, meta);
  return postToResend(
    {
      from,
      to: [to],
      reply_to: data.email,
      subject: `New contact form submission — ${data.firstName} ${data.lastName}`,
      text,
      html,
    },
    apiKey,
  );
}

/**
 * OPTIONAL auto-reply to the visitor. Prepared but DISABLED until the sender
 * domain and wording are confirmed — flip the flag (and confirm CONTACT_FROM_EMAIL
 * is a verified domain) to enable. Not called by the action yet.
 */
export const VISITOR_CONFIRMATION_ENABLED = false;

export async function sendVisitorConfirmation(data: ContactInput): Promise<SendResult> {
  if (!VISITOR_CONFIRMATION_ENABLED) return { sent: false, reason: "disabled" };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, reason: "unconfigured", missing: ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"] };

  const text = `Hi ${data.firstName},\n\nThanks for reaching out to Real Estate Broker Match. We received your message and will be in touch shortly. For anything urgent, call (800) 841-5033.\n\n— Real Estate Broker Match`;
  return postToResend(
    { from, to: [data.email], subject: "We received your message — Real Estate Broker Match", text },
    apiKey,
  );
}

"use server";

import { contactSchema } from "@/lib/contact/validation";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Contact form submission. Validates server-side and screens the honeypot.
 *
 * ⚠️ EMAIL IS NOT SENT YET — the destination address and email provider haven't
 * been confirmed. This action validates, blocks spam, and is structured so a
 * provider call (Resend / SES / Postmark …) drops in at the marked spot. It
 * returns success so the UI flow can be tested end-to-end. No secrets are read
 * here; any provider key will be a server-only env var, never NEXT_PUBLIC_.
 *
 * TODO (to make submissions operational):
 *   1. Confirm the recipient email address.
 *   2. Choose an email provider + add its API key as a server-only env var.
 *   3. Send the email (and/or persist to a Supabase table) at the marked spot.
 *   4. Add real rate limiting (e.g. per-IP token bucket / provider throttle).
 */
export async function submitContact(raw: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const key = i.path.length ? String(i.path[0]) : "form";
      if (!fieldErrors[key]) fieldErrors[key] = i.message;
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  // Honeypot: a filled "company" field means a bot. Silently succeed so the bot
  // gets no signal, but do nothing.
  if (parsed.data.company) return { ok: true };

  // ── Send the message here once the destination + provider are confirmed. ──
  // e.g. await sendEmail({ to: CONTACT_RECIPIENT, subject, text })
  //      and/or await supabase.from("contact_messages").insert({ ... })
  // Do NOT log full message bodies or PII.

  return { ok: true };
}

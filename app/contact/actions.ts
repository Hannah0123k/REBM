"use server";

import { headers } from "next/headers";

import { sendContactEmail, sendVisitorConfirmation } from "@/lib/contact/email";
import { createRateLimiter } from "@/lib/contact/rateLimit";
import { contactSchema } from "@/lib/contact/validation";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Best-effort per-IP rate limit (see lib/contact/rateLimit — in-memory, not
 * distributed; back with a shared store for production hardening).
 */
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

/**
 * Contact form submission. Re-validates server-side, screens the honeypot,
 * rate-limits per IP, then sends the notification email via Resend.
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

  // Honeypot: a filled "website" field means a bot. Silently succeed so the bot
  // gets no signal, but send nothing.
  if (parsed.data.website) return { ok: true };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limiter.check(ip)) {
    return {
      ok: false,
      error: "Too many messages from this device. Please wait a few minutes and try again.",
    };
  }

  // Submission source, server-derived (never trust the browser for this): the
  // page the form was submitted from, taken from the Referer.
  const referer = h.get("referer") ?? "";
  let source = "/contact";
  try {
    if (referer) source = new URL(referer).pathname || source;
  } catch {
    /* malformed referer — keep the default */
  }

  const result = await sendContactEmail(parsed.data, { submittedAt: new Date(), ip, source });
  if (!result.sent) {
    if (result.reason === "unconfigured") {
      // No secrets logged — just which env vars still need to be set.
      console.warn(`[contact] email not configured — set: ${result.missing.join(", ")}`);
    } else if (result.reason === "provider_error") {
      console.error(`[contact] Resend send failed: ${result.detail}`);
    }
    return {
      ok: false,
      error:
        "Sorry — we couldn’t send your message right now. Please call (800) 841-5033, or try again shortly.",
    };
  }

  // Visitor auto-reply is BEST-EFFORT and secondary: the lead has already been
  // delivered, so a confirmation failure must never fail the submission. It's a
  // no-op unless CONTACT_CONFIRMATION_ENABLED=true.
  try {
    const confirm = await sendVisitorConfirmation(parsed.data);
    if (!confirm.sent && confirm.reason === "provider_error") {
      console.error(`[contact] visitor confirmation failed (non-fatal): ${confirm.detail}`);
    }
  } catch (e) {
    console.error(`[contact] visitor confirmation threw (non-fatal): ${e instanceof Error ? e.message : "unknown"}`);
  }

  return { ok: true };
}

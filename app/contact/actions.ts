"use server";

import { headers } from "next/headers";

import { sendContactEmail, sendVisitorConfirmation } from "@/lib/contact/email";
import { clientIp, createRateLimiter, hashIp, isRateLimited } from "@/lib/contact/rateLimit";
import { contactSchema } from "@/lib/contact/validation";
import { createClient } from "@/lib/supabase/server";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const RATE_MAX = 5;
const RATE_WINDOW_SECONDS = 10 * 60;

/** Per-instance fallback used when the shared Postgres store is unavailable. */
const memLimiter = createRateLimiter({ windowMs: RATE_WINDOW_SECONDS * 1000, max: RATE_MAX });

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
  // Trusted client IP (x-real-ip / first XFF hop), hashed so no raw IP is stored.
  const ipHash = hashIp(clientIp((name) => h.get(name)));
  const limited = await isRateLimited({
    ipHash,
    fallback: memLimiter,
    onFallback: () =>
      console.warn("[contact] shared rate-limit store unavailable — using in-memory fallback"),
    // Shared, cross-instance limit via Postgres (migration 0005). Throws → the
    // combinator fails safe to the in-memory fallback above.
    sharedCheck: async (hash) => {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("contact_rate_check", {
        p_ip_hash: hash,
        p_max: RATE_MAX,
        p_window_seconds: RATE_WINDOW_SECONDS,
      });
      if (error) throw error;
      return data === true;
    },
  });
  if (limited) {
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

  // `ip` is intentionally omitted from the email meta (it was only ever for rate
  // limiting, which now happens above via a hashed key — no raw IP in the email).
  const result = await sendContactEmail(parsed.data, { submittedAt: new Date(), source });
  if (!result.sent) {
    if (result.reason === "unconfigured") {
      // No secrets logged — just which env vars still need to be set.
      console.warn(`[contact] email not configured — set: ${result.missing.join(", ")}`);
      // DEVELOPMENT ONLY: show the success screen so the flow can be previewed
      // locally without Resend configured. In PRODUCTION we must NEVER report
      // success when nothing was sent (leads would be silently lost) — fail
      // clearly instead. Once the Resend env vars are set this branch never runs.
      if (process.env.NODE_ENV !== "production") return { ok: true };
      return {
        ok: false,
        error: "Sorry — we couldn’t send your message right now. Please try again shortly.",
      };
    }
    if (result.reason === "provider_error") {
      console.error(`[contact] Resend send failed: ${result.detail}`);
    }
    return {
      ok: false,
      error:
        "Sorry — we couldn’t send your message right now. Please try again shortly.",
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

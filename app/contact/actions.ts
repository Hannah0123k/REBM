"use server";

import { headers } from "next/headers";

import { sendContactEmail } from "@/lib/contact/email";
import { contactSchema } from "@/lib/contact/validation";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Best-effort in-memory rate limit. This is PREPARATION only: the Map lives in a
 * single server instance and resets on redeploy/scale-out, so it is not a real
 * distributed limiter. For production, back this with a shared store (e.g.
 * Upstash Redis / Vercel KV) keyed the same way.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

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
  if (rateLimited(ip)) {
    return {
      ok: false,
      error: "Too many messages from this device. Please wait a few minutes and try again.",
    };
  }

  const result = await sendContactEmail(parsed.data, { submittedAt: new Date(), ip });
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

  return { ok: true };
}

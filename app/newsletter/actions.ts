"use server";

import { headers } from "next/headers";

import { createRateLimiter } from "@/lib/contact/rateLimit";
import { subscribeToNewsletter } from "@/lib/newsletter/subscribe";
import { newsletterSchema } from "@/lib/newsletter/validation";

/**
 * Newsletter signup result. `ok:true` splits into a real subscription
 * (`delivered:true`) and an honest "backend not live yet" acknowledgement
 * (`delivered:false`) — the UI shows a real success for the former and a neutral
 * notice for the latter, never a fake success.
 */
export type NewsletterResult =
  | { ok: true; delivered: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Best-effort per-IP rate limit (see lib/contact/rateLimit — in-memory). */
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 });

/**
 * Newsletter subscription. Re-validates server-side, screens the honeypot,
 * rate-limits per IP, then subscribes via the configured backend (Resend
 * audience). Never fabricates a success when the backend isn't configured.
 */
export async function subscribeNewsletter(raw: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const key = i.path.length ? String(i.path[0]) : "form";
      if (!fieldErrors[key]) fieldErrors[key] = i.message;
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  // Honeypot: a filled "website" field means a bot. Silently accept (no signal)
  // but subscribe nothing.
  if (parsed.data.website) return { ok: true, delivered: true };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limiter.check(ip)) {
    return {
      ok: false,
      error: "Too many requests from this device. Please wait a few minutes and try again.",
    };
  }

  const result = await subscribeToNewsletter(parsed.data);
  if (result.subscribed) return { ok: true, delivered: true };

  if (result.reason === "unconfigured") {
    // No secrets logged — just which env vars still need to be set.
    console.warn(`[newsletter] backend not configured — set: ${result.missing.join(", ")}`);
    return { ok: true, delivered: false };
  }

  // provider_error — a real failure the visitor should be asked to retry.
  console.error(`[newsletter] subscribe failed: ${result.detail}`);
  return {
    ok: false,
    error: "Sorry — we couldn’t sign you up right now. Please try again in a moment.",
  };
}

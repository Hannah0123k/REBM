"use server";

import { headers } from "next/headers";

import { createRateLimiter } from "@/lib/contact/rateLimit";
import { createMondayItem } from "@/lib/monday/client";
import { REBM_GROUP_ID, buildSubscriberItem } from "@/lib/monday/prospects";
import { sendSubscriberNotification } from "@/lib/newsletter/notify";
import { splitName, subscribeToNewsletter } from "@/lib/newsletter/subscribe";
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

  // Monday CRM record is BEST-EFFORT and secondary — it never changes what the
  // subscriber sees. It runs on the two paths that ACCEPT the signup (a real
  // Resend subscription, or the honest "not live yet" acknowledgement), and NOT
  // on the provider_error path below: that one asks the visitor to try again,
  // and writing here first would put a duplicate on the board when they do.
  if (result.subscribed || result.reason === "unconfigured") {
    try {
      const { firstName, lastName } = splitName(parsed.data.fullName);
      const item = buildSubscriberItem(
        { firstName, lastName, email: parsed.data.email },
        new Date(),
      );
      const crm = await createMondayItem({ groupId: REBM_GROUP_ID, ...item });
      if (crm.created) {
        console.log(`[newsletter] Monday item created id=${crm.id}`);
      } else if (crm.reason === "unconfigured") {
        // Names only — never any value.
        console.warn(`[newsletter] Monday not configured — set: ${crm.missing.join(", ")}`);
      } else {
        console.error(`[newsletter] Monday create failed (non-fatal): ${crm.detail}`);
      }
    } catch (e) {
      console.error(
        `[newsletter] Monday create threw (non-fatal): ${e instanceof Error ? e.message : "unknown"}`,
      );
    }

    // Internal "someone subscribed" notice to the team, sent AFTER the Monday
    // record so the subscriber is already captured. Also best-effort: the
    // signup is recorded either way, so a Resend outage must not undo it or
    // change what the visitor sees. Never sent to the subscriber — recipients
    // come only from server env.
    try {
      const notice = await sendSubscriberNotification({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        subscribedAt: new Date(),
      });
      if (notice.sent) {
        console.log("[newsletter] internal notification sent");
      } else if (notice.reason === "unconfigured") {
        // Names only — never any value.
        console.warn(`[newsletter] notification not configured — set: ${notice.missing.join(", ")}`);
      } else if (notice.reason === "provider_error") {
        console.error(`[newsletter] notification failed (non-fatal): ${notice.detail}`);
      }
    } catch (e) {
      console.error(
        `[newsletter] notification threw (non-fatal): ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
  }

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

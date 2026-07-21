import type { NewsletterInput } from "@/lib/newsletter/validation";

/**
 * Newsletter subscription via Resend's Audiences (Contacts) HTTP API — called
 * with fetch, so no SDK dependency. Runs server-side only; the API key and
 * audience id are server env vars and are never sent to the client.
 *
 * FUTURE-READY, HONEST: if the backend isn't configured yet we do NOT fake a
 * signup. `subscribeToNewsletter` returns `{ subscribed:false, reason:"unconfigured" }`
 * and the caller surfaces an honest "not live yet" message. The moment the two
 * env vars below are set, the same code path performs a real subscription and
 * the UI shows a real success — no other change required.
 *
 * Required env vars (documented in .env.example):
 *   RESEND_API_KEY               — Resend API key (server-only, never NEXT_PUBLIC_)
 *   RESEND_NEWSLETTER_AUDIENCE_ID — target Resend audience id
 *
 * To swap Resend for another provider (Mailchimp, Buttondown, a DB table…),
 * replace only `postToResendAudience` and `resolveConfig` — the result contract
 * and the action/UI stay the same.
 */
export type SubscribeResult =
  | { subscribed: true; id?: string }
  | { subscribed: false; reason: "unconfigured"; missing: string[] }
  | { subscribed: false; reason: "provider_error"; detail: string };

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no network, no env side effects).
// ---------------------------------------------------------------------------

/**
 * Split a free-text full name into first / last for providers that store them
 * separately. Everything before the last space is the first name; the remainder
 * is the last name. A single token has no last name.
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

/** Resolve backend config from server env, reporting which vars are still unset. */
export function resolveConfig(env: Record<string, string | undefined> = process.env): {
  apiKey?: string;
  audienceId?: string;
  missing: string[];
} {
  const apiKey = (env.RESEND_API_KEY ?? "").trim() || undefined;
  const audienceId = (env.RESEND_NEWSLETTER_AUDIENCE_ID ?? "").trim() || undefined;
  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!audienceId) missing.push("RESEND_NEWSLETTER_AUDIENCE_ID");
  return { apiKey, audienceId, missing };
}

// ---------------------------------------------------------------------------
// Network layer.
// ---------------------------------------------------------------------------

async function postToResendAudience(
  data: NewsletterInput,
  apiKey: string,
  audienceId: string,
): Promise<SubscribeResult> {
  const { firstName, lastName } = splitName(data.fullName);
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        unsubscribed: false,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { subscribed: false, reason: "provider_error", detail: `${res.status} ${detail.slice(0, 300)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { subscribed: true, id: json.id };
  } catch (e) {
    return {
      subscribed: false,
      reason: "provider_error",
      detail: e instanceof Error ? e.message : "network error",
    };
  }
}

/** Add the subscriber to the configured Resend audience, or report why it can't. */
export async function subscribeToNewsletter(data: NewsletterInput): Promise<SubscribeResult> {
  const { apiKey, audienceId, missing } = resolveConfig();
  if (!apiKey || !audienceId) return { subscribed: false, reason: "unconfigured", missing };
  return postToResendAudience(data, apiKey, audienceId);
}

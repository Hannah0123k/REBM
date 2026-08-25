// Relative, not the usual "@/" alias: this is a RUNTIME import, and the bare
// Node test runner (npm test) cannot resolve "@/". Every other unit-tested lib
// module gets away with "@/" only because its cross-module imports are
// type-only and therefore erased. Duplicating escapeHtml/resolveRecipients here
// to keep the alias would be far worse than one relative path.
import { escapeHtml, oneLine, postToResend, resolveRecipients, type SendResult } from "../contact/email.ts";

/**
 * INTERNAL notification email for a newsletter signup — "someone subscribed",
 * sent to the team. Server-side only.
 *
 * This is NOT a Resend Audience operation and has nothing to do with
 * lib/newsletter/subscribe.ts. It reuses the contact form's existing Resend
 * setup wholesale: the same API key, the same verified sender, the same
 * recipients, and the same transport (postToResend — one timeout and one error
 * shape for every internal email this site sends).
 *
 * It is NEVER sent to the subscriber. Recipients come only from server env, so
 * the browser payload can't redirect it.
 *
 * Env (documented in .env.example):
 *   RESEND_API_KEY               — reused (server-only, never NEXT_PUBLIC_)
 *   CONTACT_FROM_EMAIL           — reused verified sender
 *   NEWSLETTER_NOTIFICATION_EMAIL — OPTIONAL override; when unset the signup
 *                                  notice goes to the same inboxes the contact
 *                                  form already notifies (Alan + Rhett).
 */

export type SubscriberNotice = { fullName: string; email: string; subscribedAt: Date };

/** Matches the contact notification's stamp so both internal emails read alike. */
const TEAM_TIME_ZONE = "America/Denver";

export function formatNoticeDate(d: Date): string {
  return `${d.toLocaleString("en-US", { timeZone: TEAM_TIME_ZONE })} (MT)`;
}

/**
 * Who receives the signup notice. Prefers NEWSLETTER_NOTIFICATION_EMAIL (a
 * comma-separated list is allowed) so subscriber notices can be routed to a
 * different inbox later; otherwise falls back to the recipients the contact
 * form already uses, so this needs NO new environment variable to work.
 */
export function resolveNotificationRecipients(
  env: Record<string, string | undefined> = process.env,
): { to: string[]; missing: string[] } {
  const explicit = (env.NEWSLETTER_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  if (explicit.length) return { to: explicit, missing: [] };

  const { to, missing } = resolveRecipients(env);
  if (to.length) return { to, missing: [] };
  // Nothing configured either way — report both routes so the log is actionable.
  return { to: [], missing: [...missing, "NEWSLETTER_NOTIFICATION_EMAIL"] };
}

/** Subject + text/HTML body. Pure — exported for unit testing. */
export function buildSubscriberNotification(notice: SubscriberNotice): {
  subject: string;
  text: string;
  html: string;
} {
  const name = notice.fullName.trim();
  const email = notice.email.trim();
  const date = formatNoticeDate(notice.subscribedAt);

  const text = [
    "New subscriber from Real Estate Broker Match",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Date: ${date}`,
  ].join("\n");

  // Subscriber-supplied name/email are escaped before going anywhere near HTML.
  const html = [
    `<p>New subscriber from Real Estate Broker Match</p>`,
    `<p>`,
    `Name: ${escapeHtml(name)}<br>`,
    `Email: <a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a><br>`,
    `Date: ${escapeHtml(date)}`,
    `</p>`,
  ].join("\n");

  // oneLine defuses header injection via a newline in the subject. The subject
  // is a constant today, but it goes through the same guard as every other one.
  return { subject: oneLine("New Website Subscriber"), text, html };
}

/**
 * Send the internal signup notice. Best-effort by contract: the caller has
 * already recorded the subscriber in Monday, so a failure here must NOT undo
 * that or change what the visitor sees — it returns a result to log, never
 * throws for the caller to handle.
 */
export async function sendSubscriberNotification(notice: SubscriberNotice): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const { to, missing: recipMissing } = resolveNotificationRecipients();

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("CONTACT_FROM_EMAIL");
  missing.push(...recipMissing);
  if (missing.length || !apiKey) return { sent: false, reason: "unconfigured", missing };

  const { subject, text, html } = buildSubscriberNotification(notice);
  // reply_to is the subscriber, so a team member can answer them directly —
  // but the message itself only ever goes `to` the server-configured inboxes.
  return postToResend({ from, to, reply_to: notice.email, subject, text, html }, apiKey);
}

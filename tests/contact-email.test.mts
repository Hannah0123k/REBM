/**
 * Unit tests for the contact-form email workflow — no network, no browser.
 * Run: `npm test` (Node's built-in runner, native TS type-stripping).
 *
 * Covers: recipient resolution (both Alan + Rhett, dedupe, fallback), subject +
 * header-injection defense, Reply-To behavior, rendered fields (optional omitted,
 * HTML-escaped), visitor confirmation, validation (invalid/missing/honeypot),
 * rate limiting, and Resend success/failure — asserting recipients come only
 * from server env and no secret leaks into the message body.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import {
  buildSubject,
  renderContactEmail,
  renderVisitorConfirmation,
  resolveRecipients,
  resolveReplyTo,
  oneLine,
  sendContactEmail,
  visitorConfirmationEnabled,
} from "../lib/contact/email.ts";
import { createRateLimiter } from "../lib/contact/rateLimit.ts";
import { contactSchema } from "../lib/contact/validation.ts";

// A valid submission used across tests.
const VALID = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "(800) 841-5033",
  isBroker: "yes" as const,
  heardAbout: "Google",
  message: "I own a retail property and want to find the right broker.",
  website: "",
};

// ── resolveRecipients ─────────────────────────────────────────────────────────
test("resolveRecipients returns BOTH Alan and Rhett", () => {
  const { to, missing } = resolveRecipients({
    CONTACT_RECIPIENT_ALAN: "alan@rebm.com",
    CONTACT_RECIPIENT_RHETT: "rhett@rebm.com",
  });
  assert.deepEqual(to, ["alan@rebm.com", "rhett@rebm.com"]);
  assert.deepEqual(missing, []);
});

test("resolveRecipients de-duplicates identical addresses", () => {
  const { to } = resolveRecipients({
    CONTACT_RECIPIENT_ALAN: "team@rebm.com",
    CONTACT_RECIPIENT_RHETT: "Team@rebm.com", // same box, different case
  });
  assert.equal(to.length, 1);
});

test("resolveRecipients falls back to the legacy single var", () => {
  const { to, missing } = resolveRecipients({ CONTACT_RECIPIENT_EMAIL: "legacy@rebm.com" });
  assert.deepEqual(to, ["legacy@rebm.com"]);
  assert.deepEqual(missing, []);
});

test("resolveRecipients reports missing when nothing is configured", () => {
  const { to, missing } = resolveRecipients({});
  assert.equal(to.length, 0);
  assert.ok(missing.includes("CONTACT_RECIPIENT_ALAN"));
});

// ── buildSubject + header-injection defense ───────────────────────────────────
test("buildSubject includes the lead name and broker qualifier", () => {
  assert.equal(buildSubject(VALID), "New REBM lead: John Doe — Real estate agent/broker");
  assert.equal(buildSubject({ ...VALID, isBroker: "no" }), "New REBM lead: John Doe");
});

test("buildSubject strips newlines (header-injection defense)", () => {
  const s = buildSubject({ ...VALID, firstName: "John\r\nBcc: evil@x.com", lastName: "Doe" });
  assert.ok(!/[\r\n]/.test(s));
});

test("oneLine collapses CR/LF/tabs", () => {
  assert.equal(oneLine("a\r\nb\tc"), "a b c");
});

// ── resolveReplyTo ────────────────────────────────────────────────────────────
test("resolveReplyTo uses the visitor's validated email", () => {
  assert.equal(resolveReplyTo(VALID, {}), "john@example.com");
});

test("resolveReplyTo uses the fallback only when no visitor email", () => {
  assert.equal(
    resolveReplyTo({ email: "" }, { CONTACT_REPLY_TO_FALLBACK: "fallback@rebm.com" }),
    "fallback@rebm.com",
  );
});

// ── renderContactEmail ────────────────────────────────────────────────────────
test("renderContactEmail shows all present fields in html and text", () => {
  const { html, text } = renderContactEmail(VALID, {
    submittedAt: new Date("2026-07-20T18:00:00Z"),
    source: "/contact",
  });
  for (const needle of ["John Doe", "john@example.com", "(800) 841-5033", "Google", "/contact", VALID.message]) {
    assert.ok(html.includes(needle), `html missing: ${needle}`);
    assert.ok(text.includes(needle), `text missing: ${needle}`);
  }
  // clickable links present
  assert.ok(html.includes("mailto:john%40example.com"));
  assert.ok(html.includes("tel:8008415033"));
});

test("renderContactEmail omits the optional 'How they found us' row when blank", () => {
  const { html, text } = renderContactEmail(
    { ...VALID, heardAbout: "" },
    { submittedAt: new Date("2026-07-20T18:00:00Z") },
  );
  assert.ok(!html.includes("How they found us"));
  assert.ok(!text.includes("How they found us"));
});

test("renderContactEmail HTML-escapes user content (no injection)", () => {
  const { html } = renderContactEmail(
    { ...VALID, message: "<script>alert(1)</script>" },
    { submittedAt: new Date("2026-07-20T18:00:00Z") },
  );
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

// ── visitor confirmation ──────────────────────────────────────────────────────
test("renderVisitorConfirmation is honest — greets by name, echoes the message, promises no deadline", () => {
  const { subject, html, text } = renderVisitorConfirmation(VALID);
  assert.ok(subject.includes("received"));
  assert.ok(html.includes("John"));
  assert.ok(html.includes(VALID.message));
  assert.ok(text.includes(VALID.message));
  // No fabricated response-time promise.
  assert.ok(!/\b\d+\s*(hours|business days|days)\b/i.test(text));
});

test("visitorConfirmationEnabled is off unless explicitly enabled", () => {
  assert.equal(visitorConfirmationEnabled({}), false);
  assert.equal(visitorConfirmationEnabled({ CONTACT_CONFIRMATION_ENABLED: "true" }), true);
});

// ── validation ────────────────────────────────────────────────────────────────
test("contactSchema accepts a valid submission", () => {
  assert.equal(contactSchema.safeParse(VALID).success, true);
});

test("contactSchema rejects an invalid email", () => {
  assert.equal(contactSchema.safeParse({ ...VALID, email: "not-an-email" }).success, false);
});

test("contactSchema rejects disposable email domains", () => {
  assert.equal(contactSchema.safeParse({ ...VALID, email: "a@mailinator.com" }).success, false);
});

test("contactSchema rejects missing required fields", () => {
  const r = contactSchema.safeParse({ ...VALID, firstName: "", message: "" });
  assert.equal(r.success, false);
});

test("contactSchema honeypot: 'website' must be empty", () => {
  assert.equal(contactSchema.safeParse({ ...VALID, website: "http://spam" }).success, false);
  assert.equal(contactSchema.safeParse({ ...VALID, website: "" }).success, true);
});

// ── rate limiter ──────────────────────────────────────────────────────────────
test("rate limiter allows up to max then blocks, and resets after the window", () => {
  let now = 0;
  const rl = createRateLimiter({ windowMs: 1000, max: 3, now: () => now });
  assert.equal(rl.check("ip"), false); // 1
  assert.equal(rl.check("ip"), false); // 2
  assert.equal(rl.check("ip"), false); // 3
  assert.equal(rl.check("ip"), true); //  4 → over
  now += 2000; // window passes
  assert.equal(rl.check("ip"), false); // count reset
});

test("rate limiter is per-key", () => {
  const now = 0;
  const rl = createRateLimiter({ windowMs: 1000, max: 1, now: () => now });
  assert.equal(rl.check("a"), false);
  assert.equal(rl.check("b"), false); // different key unaffected
});

// ── sendContactEmail (mocked Resend) ──────────────────────────────────────────
const ENV_KEYS = [
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_RECIPIENT_ALAN",
  "CONTACT_RECIPIENT_RHETT",
  "CONTACT_RECIPIENT_EMAIL",
];
let savedEnv: Record<string, string | undefined>;
let savedFetch: typeof globalThis.fetch;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  savedFetch = globalThis.fetch;
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  globalThis.fetch = savedFetch;
});

test("sendContactEmail reports 'unconfigured' with missing var names when env is unset", async () => {
  const r = await sendContactEmail(VALID, { submittedAt: new Date() });
  assert.equal(r.sent, false);
  assert.equal(r.reason === "unconfigured" && r.missing.includes("RESEND_API_KEY"), true);
});

test("sendContactEmail sends to BOTH recipients, sets Reply-To to the visitor, keeps the key out of the body", async () => {
  process.env.RESEND_API_KEY = "re_test_secret";
  process.env.CONTACT_FROM_EMAIL = "REBM <no-reply@rebm.com>";
  process.env.CONTACT_RECIPIENT_ALAN = "alan@rebm.com";
  process.env.CONTACT_RECIPIENT_RHETT = "rhett@rebm.com";

  let captured: { auth: string | null; body: any } = { auth: null, body: null };
  globalThis.fetch = (async (_url: string, init: any) => {
    captured = { auth: init.headers.Authorization, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
  }) as typeof globalThis.fetch;

  const r = await sendContactEmail(VALID, { submittedAt: new Date() });
  assert.equal(r.sent, true);
  assert.equal(r.sent === true && r.id, "email_123");
  assert.deepEqual(captured.body.to, ["alan@rebm.com", "rhett@rebm.com"]);
  assert.equal(captured.body.reply_to, "john@example.com");
  assert.equal(captured.body.from, "REBM <no-reply@rebm.com>");
  // Secret travels in the auth header, never in the message payload.
  assert.equal(captured.auth, "Bearer re_test_secret");
  assert.ok(!JSON.stringify(captured.body).includes("re_test_secret"));
});

test("sendContactEmail surfaces a provider_error on a non-OK Resend response", async () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.CONTACT_FROM_EMAIL = "REBM <no-reply@rebm.com>";
  process.env.CONTACT_RECIPIENT_ALAN = "alan@rebm.com";
  globalThis.fetch = (async () =>
    new Response("domain not verified", { status: 403 })) as typeof globalThis.fetch;

  const r = await sendContactEmail(VALID, { submittedAt: new Date() });
  assert.equal(r.sent, false);
  assert.equal(r.reason === "provider_error" && r.detail.startsWith("403"), true);
});

test("sendContactEmail catches a network/thrown error as provider_error", async () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.CONTACT_FROM_EMAIL = "REBM <no-reply@rebm.com>";
  process.env.CONTACT_RECIPIENT_ALAN = "alan@rebm.com";
  globalThis.fetch = (async () => {
    throw new Error("socket hang up");
  }) as typeof globalThis.fetch;

  const r = await sendContactEmail(VALID, { submittedAt: new Date() });
  assert.equal(r.sent, false);
  assert.equal(r.reason === "provider_error" && r.detail.includes("socket hang up"), true);
});

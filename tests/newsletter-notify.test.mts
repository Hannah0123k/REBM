/**
 * Unit tests for the internal subscriber-notification email — PURE logic only:
 * no network, no env mutation, no API key.
 *
 * The things worth locking down here are the ones that would be silently wrong:
 * that the notice can never be addressed to the subscriber, that it falls back
 * to the contact form's existing inboxes so no new env var is required, and
 * that subscriber-supplied text is escaped before it reaches HTML.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildSubscriberNotification,
  formatNoticeDate,
  resolveNotificationRecipients,
} from "../lib/newsletter/notify.ts";

const NOTICE = {
  fullName: "Priya Raman",
  email: "priya@example.com",
  subscribedAt: new Date("2026-08-26T02:30:00Z"),
};

// ── recipients ──────────────────────────────────────────────────────────────

test("falls back to the contact form's recipients when no override is set", () => {
  const { to, missing } = resolveNotificationRecipients({
    CONTACT_RECIPIENT_ALAN: "alan@example.com",
    CONTACT_RECIPIENT_RHETT: "rhett@example.com",
  });
  assert.deepEqual(to, ["alan@example.com", "rhett@example.com"]);
  assert.deepEqual(missing, []);
});

test("NEWSLETTER_NOTIFICATION_EMAIL overrides the contact recipients", () => {
  const { to } = resolveNotificationRecipients({
    NEWSLETTER_NOTIFICATION_EMAIL: "list@example.com",
    CONTACT_RECIPIENT_ALAN: "alan@example.com",
  });
  assert.deepEqual(to, ["list@example.com"]);
});

test("the override accepts a comma-separated list", () => {
  const { to } = resolveNotificationRecipients({
    NEWSLETTER_NOTIFICATION_EMAIL: "a@example.com, b@example.com ,",
  });
  assert.deepEqual(to, ["a@example.com", "b@example.com"]);
});

test("with nothing configured it names BOTH routes to fix it", () => {
  const { to, missing } = resolveNotificationRecipients({});
  assert.deepEqual(to, []);
  assert.ok(missing.includes("NEWSLETTER_NOTIFICATION_EMAIL"));
  assert.ok(missing.includes("CONTACT_RECIPIENT_ALAN"));
});

test("the legacy single-recipient var still works", () => {
  const { to } = resolveNotificationRecipients({ CONTACT_RECIPIENT_EMAIL: "legacy@example.com" });
  assert.deepEqual(to, ["legacy@example.com"]);
});

// ── body ────────────────────────────────────────────────────────────────────

test("subject is exactly the requested string", () => {
  assert.equal(buildSubscriberNotification(NOTICE).subject, "New Website Subscriber");
});

test("text body matches the requested shape", () => {
  const { text } = buildSubscriberNotification(NOTICE);
  const lines = text.split("\n");
  assert.equal(lines[0], "New subscriber from Real Estate Broker Match");
  assert.equal(lines[1], "");
  assert.equal(lines[2], "Name: Priya Raman");
  assert.equal(lines[3], "Email: priya@example.com");
  assert.match(lines[4], /^Date: /);
});

test("the date is stamped in the team's zone, not UTC", () => {
  // 02:30 UTC on the 26th is still the evening of the 25th in Mountain Time.
  assert.match(formatNoticeDate(NOTICE.subscribedAt), /8\/25\/2026/);
  assert.match(formatNoticeDate(NOTICE.subscribedAt), /\(MT\)$/);
});

test("subscriber-supplied name is escaped before reaching HTML", () => {
  const { html } = buildSubscriberNotification({
    ...NOTICE,
    fullName: '<script>alert("x")</script>',
  });
  assert.ok(!html.includes("<script>"), "raw script tag must not survive");
  assert.ok(html.includes("&lt;script&gt;"));
});

test("both bodies carry the subscriber's name and email", () => {
  const { text, html } = buildSubscriberNotification(NOTICE);
  for (const body of [text, html]) {
    assert.ok(body.includes("Priya Raman"));
    assert.ok(body.includes("priya@example.com"));
  }
});

/**
 * Unit tests for newsletter backend helpers (lib/newsletter/subscribe) — pure,
 * no network, no env side effects. Covers name splitting for providers that
 * store first/last separately and the honest "which env vars are missing"
 * config resolver.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveConfig, splitName } from "../lib/newsletter/subscribe.ts";

test("splitName separates first and last on the final space", () => {
  assert.deepEqual(splitName("Jane Doe"), { firstName: "Jane", lastName: "Doe" });
  assert.deepEqual(splitName("Mary Jane Watson"), { firstName: "Mary Jane", lastName: "Watson" });
  assert.deepEqual(splitName("Cher"), { firstName: "Cher", lastName: "" });
});

test("splitName tolerates blanks and extra whitespace", () => {
  assert.deepEqual(splitName("   "), { firstName: "", lastName: "" });
  assert.deepEqual(splitName("  Jane   Doe  "), { firstName: "Jane", lastName: "Doe" });
});

test("resolveConfig reports no missing vars when both are set", () => {
  const cfg = resolveConfig({ RESEND_API_KEY: "re_x", RESEND_NEWSLETTER_AUDIENCE_ID: "aud_1" });
  assert.deepEqual(cfg.missing, []);
  assert.equal(cfg.apiKey, "re_x");
  assert.equal(cfg.audienceId, "aud_1");
});

test("resolveConfig treats empty / whitespace vars as missing", () => {
  assert.deepEqual(resolveConfig({ RESEND_API_KEY: "re_x", RESEND_NEWSLETTER_AUDIENCE_ID: "  " }).missing, [
    "RESEND_NEWSLETTER_AUDIENCE_ID",
  ]);
  assert.deepEqual(resolveConfig({}).missing, ["RESEND_API_KEY", "RESEND_NEWSLETTER_AUDIENCE_ID"]);
});

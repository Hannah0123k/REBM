/**
 * Unit tests for the Monday mapping's PURE logic — no network, no env, no token.
 * Run: `npm test` (Node's built-in runner, native TS type-stripping).
 *
 * These lock the two things that are easy to get wrong and expensive to notice:
 * the exact column-value SHAPES Monday expects (a wrong shape is accepted with
 * a 200 and silently dropped), and the rule that a subscriber record must stay
 * sparse rather than be padded with placeholder values.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { readGraphQLError, resolveConfig } from "../lib/monday/config.ts";
import {
  COL,
  LEAD_STATUS_NEW,
  buildComments,
  buildInquiryItem,
  buildSubscriberItem,
  toMondayDate,
  toMondayPhone,
} from "../lib/monday/prospects.ts";

const INQUIRY = {
  firstName: "Dana",
  lastName: "Okonkwo",
  email: "dana@example.com",
  phone: "(555) 123-9876",
  isBroker: "yes",
  heardAbout: "Google search",
  message: "I own a retail strip in Boulder and want to sell.",
  website: "",
} as const;

// ── config ──────────────────────────────────────────────────────────────────

test("resolveConfig reports both env var names when nothing is set", () => {
  const { token, boardId, missing } = resolveConfig({});
  assert.equal(token, undefined);
  assert.equal(boardId, undefined);
  assert.deepEqual(missing, ["MONDAY_API_TOKEN", "MONDAY_CONTACTS_BOARD_ID"]);
});

test("resolveConfig treats whitespace-only values as unset", () => {
  const { missing } = resolveConfig({ MONDAY_API_TOKEN: "   ", MONDAY_CONTACTS_BOARD_ID: "" });
  assert.deepEqual(missing, ["MONDAY_API_TOKEN", "MONDAY_CONTACTS_BOARD_ID"]);
});

// ── error reading ───────────────────────────────────────────────────────────
// Monday answers 200 OK for a rejected mutation, so this is the only thing
// standing between a rejected write and a silently lost lead.

test("readGraphQLError surfaces a GraphQL errors array", () => {
  const err = readGraphQLError({ errors: [{ message: "Board not found" }] });
  assert.match(String(err), /Board not found/);
});

test("readGraphQLError surfaces Monday's error_message form", () => {
  assert.match(String(readGraphQLError({ error_message: "Unauthorized" })), /Unauthorized/);
});

test("readGraphQLError rejects a 200 that carries no item id", () => {
  assert.equal(readGraphQLError({ data: { create_item: null } }), "no item id returned");
});

test("readGraphQLError returns null for a real success", () => {
  assert.equal(readGraphQLError({ data: { create_item: { id: "123" } } }), null);
});

// ── value formatting ────────────────────────────────────────────────────────

test("toMondayDate formats YYYY-MM-DD in the team's zone, not UTC", () => {
  // 02:30 UTC on the 26th is still the 25th in Denver — the date the team saw.
  assert.equal(toMondayDate(new Date("2026-08-26T02:30:00Z")), "2026-08-25");
});

test("toMondayPhone adds +1 to a bare 10-digit US number", () => {
  assert.deepEqual(toMondayPhone("(555) 123-9876"), { phone: "+15551239876", countryShortName: "US" });
});

test("toMondayPhone keeps an already-prefixed country code", () => {
  assert.deepEqual(toMondayPhone("+1 206 777 5301"), { phone: "+12067775301", countryShortName: "US" });
});

// ── inquiry ─────────────────────────────────────────────────────────────────

test("inquiry item name is the FIRST name only, matching the board's convention", () => {
  const { itemName, columnValues } = buildInquiryItem(INQUIRY, new Date("2026-08-25T18:00:00Z"));
  assert.equal(itemName, "Dana");
  assert.equal(columnValues[COL.lastName], "Okonkwo");
});

test("inquiry maps every field the board has a column for", () => {
  const { columnValues } = buildInquiryItem(INQUIRY, new Date("2026-08-25T18:00:00Z"));
  assert.deepEqual(columnValues[COL.email], { email: "dana@example.com", text: "dana@example.com" });
  assert.deepEqual(columnValues[COL.phone], { phone: "+15551239876", countryShortName: "US" });
  assert.deepEqual(columnValues[COL.isBroker], { label: "Yes" });
  // Comments now carry the message plus the folded-in referral answer.
  assert.deepEqual(columnValues[COL.message], {
    text: `${INQUIRY.message}\n\nHow did you find us?: ${INQUIRY.heardAbout}`,
  });
  assert.deepEqual(columnValues[COL.leadStatus], { label: LEAD_STATUS_NEW });
  assert.deepEqual(columnValues[COL.dateReceived], { date: "2026-08-25" });
});

test("isBroker 'no' maps to the board's No label", () => {
  const { columnValues } = buildInquiryItem({ ...INQUIRY, isBroker: "no" }, new Date());
  assert.deepEqual(columnValues[COL.isBroker], { label: "No" });
});

// ── comments composition (message + "How did you find us?") ────────────────
// The board has no referral-source column, so heardAbout is folded into the
// existing comments long-text. The visitor's own words must survive intact.

test("CONTACT A: message AND heardAbout both appear in comments", () => {
  const { columnValues } = buildInquiryItem(
    { ...INQUIRY, message: "I need help finding a broker.", heardAbout: "Google" },
    new Date(),
  );
  const text = (columnValues[COL.message] as { text: string }).text;
  assert.ok(text.includes("I need help finding a broker."), "original message must survive");
  assert.ok(text.includes("How did you find us?: Google"), "referral must be appended");
  // Visitor's words first, label after — never the other way round.
  assert.ok(text.indexOf("I need help") < text.indexOf("How did you find us?"));
});

test("CONTACT B: blank message still carries the heardAbout answer", () => {
  const { columnValues } = buildInquiryItem(
    { ...INQUIRY, message: "", heardAbout: "Referral" },
    new Date(),
  );
  const text = (columnValues[COL.message] as { text: string }).text;
  assert.equal(text, "How did you find us?: Referral");
});

test("CONTACT C: message with no heardAbout gets NO stray label", () => {
  const { columnValues } = buildInquiryItem(
    { ...INQUIRY, message: "I own a retail strip.", heardAbout: "" },
    new Date(),
  );
  const text = (columnValues[COL.message] as { text: string }).text;
  assert.equal(text, "I own a retail strip.");
  assert.ok(!text.includes("How did you find us?"), "no label when there is no answer");
});

test("neither message nor heardAbout leaves comments blank", () => {
  assert.equal(buildComments("", ""), "");
  assert.equal(buildComments(undefined, undefined), "");
});

test("buildComments ignores whitespace-only values", () => {
  assert.equal(buildComments("   ", "  "), "");
  assert.equal(buildComments("   ", "Google"), "How did you find us?: Google");
});

test("heardAbout never reaches the contact-preference column", () => {
  // single_selectca8csow asks "How should we contact you?" (Call/Email/Text) —
  // a different question. It must stay untouched.
  const { columnValues } = buildInquiryItem(INQUIRY, new Date());
  assert.equal(Object.hasOwn(columnValues, "single_selectca8csow"), false);
});

test("the honeypot field never reaches Monday", () => {
  const { columnValues } = buildInquiryItem({ ...INQUIRY, website: "spam" }, new Date());
  assert.ok(!JSON.stringify(columnValues).includes("spam"));
});

// ── subscriber ──────────────────────────────────────────────────────────────

test("subscriber sends only name, email and date", () => {
  const { itemName, columnValues } = buildSubscriberItem(
    { firstName: "Priya", lastName: "Raman", email: "priya@example.com" },
    new Date("2026-08-25T18:00:00Z"),
  );
  assert.equal(itemName, "Priya");
  assert.deepEqual(Object.keys(columnValues).sort(), [COL.dateReceived, COL.email, COL.lastName].sort());
});

test("subscriber leaves inquiry-only columns ABSENT, not blank", () => {
  const { columnValues } = buildSubscriberItem(
    { firstName: "Priya", lastName: "Raman", email: "priya@example.com" },
    new Date(),
  );
  // Absent, so Monday writes nothing — a placeholder would misrepresent the
  // record as an inquiry that answered these questions.
  for (const id of [COL.phone, COL.isBroker, COL.message, COL.leadStatus]) {
    assert.equal(Object.hasOwn(columnValues, id), false, `${id} must not be sent`);
  }
});

test("a single-token subscriber name omits Last Name rather than blanking it", () => {
  const { itemName, columnValues } = buildSubscriberItem(
    { firstName: "Cher", lastName: "", email: "cher@example.com" },
    new Date(),
  );
  assert.equal(itemName, "Cher");
  assert.equal(Object.hasOwn(columnValues, COL.lastName), false);
});

test("the caller's splitName feeds the builder, so board and Resend agree", () => {
  // splitName itself is covered in newsletter-logic.test.mts; this pins that the
  // builder faithfully carries whatever split it is handed.
  const { itemName, columnValues } = buildSubscriberItem(
    { firstName: "Ana Maria", lastName: "Silva", email: "ana@example.com" },
    new Date(),
  );
  assert.equal(itemName, "Ana Maria");
  assert.equal(columnValues[COL.lastName], "Silva");
});

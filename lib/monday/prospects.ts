import type { ContactInput } from "@/lib/contact/validation";
import type { ColumnValues } from "@/lib/monday/client";

/**
 * Website → Monday "Prospects" board mapping.
 * ===========================================================================
 * Every ID below was READ FROM THE BOARD via the API (`boards { columns { id
 * title type } }`), never inferred from a column's visible title — Monday's
 * auto-generated IDs ("single_selectep38epy") do not resemble their titles, and
 * two columns here have similar names but different meanings (see the WARNING).
 *
 *   Column ID                 Title                                    Type
 *   ------------------------  ---------------------------------------  ---------
 *   name                      Name                                     name
 *   short_text0ze59ez9        Last Name                                text
 *   emailo65brn0s             Email                                    email
 *   phoneseqvw1mg             Phone                                    phone
 *   color_mm6a605             Lead Status                              status
 *   single_selectep38epy      Are you a real estate agent or broker?   status
 *   long_text48r2dqym         Anything else you'd like us to know?     long_text
 *   date_mm0z7dgw             Date Created                             date
 *
 * ⚠ WARNING — do NOT map the contact form's `heardAbout` ("How did you find
 * Real Estate Broker Match?") onto `single_selectca8csow`. That column reads
 * "How should we contact you?" and its labels are Call / Email / Text — a
 * different question entirely. The board has no referral-source column, so
 * `heardAbout` is appended to the message long-text instead (see buildComments).
 *
 * ⚠ There is also no Submission Type (Inquiry / Subscriber) column on this
 * board, and none is required. Inquiries carry Lead Status = "New" plus phone,
 * broker answer and comments; subscribers carry only name, email and date, and
 * the code sends NO Lead Status for them. Monday still DISPLAYS "New" on an
 * untouched Lead Status, because index 5 of that column is labelled "New" —
 * that is the column's empty state, not a value written from here.
 */

// ── Column IDs (verified against the live board) ────────────────────────────
export const COL = {
  lastName: "short_text0ze59ez9",
  email: "emailo65brn0s",
  phone: "phoneseqvw1mg",
  leadStatus: "color_mm6a605",
  isBroker: "single_selectep38epy",
  message: "long_text48r2dqym",
  dateReceived: "date_mm0z7dgw",
} as const;

/** Website submissions land here, kept apart from the IPM prospects in "topics". */
export const REBM_GROUP_ID = "group_mm0qmja";

/**
 * Status labels must match the board EXACTLY — the mutation does not pass
 * `create_labels_if_missing`, so an unknown label is rejected rather than
 * silently added. "New" is an existing Lead Status label (Hannah's choice; the
 * board has no "New Inquiry").
 */
export const LEAD_STATUS_NEW = "New";
const BROKER_YES = "Yes";
const BROKER_NO = "No";

/**
 * The team reads these dates in Mountain Time — the contact notification email
 * already stamps submissions in America/Denver (lib/contact/email.ts), so the
 * Monday date matches what Alan and Rhett see in their inbox. "en-CA" formats
 * as YYYY-MM-DD, which is the format a Monday date column expects.
 */
export const TEAM_TIME_ZONE = "America/Denver";

export function toMondayDate(d: Date, timeZone: string = TEAM_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Monday's phone column stores a number plus a country. The form accepts spaces,
 * parens, hyphens and a +country code (lib/contact/validation), so strip to
 * digits and prepend "+". A 10-digit US number gets the +1 Monday expects.
 */
export function toMondayPhone(raw: string): { phone: string; countryShortName: string } {
  const digits = raw.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return { phone: e164, countryShortName: "US" };
}

/** Label used when folding the referral answer into the comments column. */
const HEARD_ABOUT_LABEL = "How did you find us?";

/**
 * Compose the comments/message long-text from the two contact-form fields that
 * belong there: `message` and `heardAbout`.
 *
 * The board has no referral-source column, so the referral answer rides along
 * inside the existing comments column rather than being dropped. The visitor's
 * own words always come FIRST and are never modified or replaced — the label is
 * appended below them, separated by a blank line, so the message still reads as
 * theirs. Either field may be absent:
 *
 *   both      → "<message>\n\nHow did you find us?: Google"
 *   message   → "<message>"
 *   heardAbout→ "How did you find us?: Referral"
 *   neither   → ""   (blank — no stray label)
 */
export function buildComments(message?: string, heardAbout?: string): string {
  const msg = (message ?? "").trim();
  const heard = (heardAbout ?? "").trim();
  const parts: string[] = [];
  if (msg) parts.push(msg);
  if (heard) parts.push(`${HEARD_ABOUT_LABEL}: ${heard}`);
  return parts.join("\n\n");
}

/**
 * Contact form → Monday columns. Item name is the FIRST name only: all five
 * existing board items follow that convention, with the surname in its own
 * "Last Name" column, so combining them here would duplicate the surname.
 */
export function buildInquiryItem(
  data: ContactInput,
  submittedAt: Date,
): { itemName: string; columnValues: ColumnValues } {
  return {
    itemName: data.firstName,
    columnValues: {
      [COL.lastName]: data.lastName,
      [COL.email]: { email: data.email, text: data.email },
      [COL.phone]: toMondayPhone(data.phone),
      [COL.isBroker]: { label: data.isBroker === "yes" ? BROKER_YES : BROKER_NO },
      [COL.message]: { text: buildComments(data.message, data.heardAbout) },
      [COL.leadStatus]: { label: LEAD_STATUS_NEW },
      [COL.dateReceived]: { date: toMondayDate(submittedAt) },
    },
  };
}

/**
 * Subscriber form → Monday columns. Deliberately sparse: phone, agent/broker,
 * message and Lead Status are OMITTED, not blanked with placeholders. A record
 * carrying only a name, an email and a date IS the signal that it came from the
 * newsletter form rather than a contact enquiry.
 *
 * Takes an ALREADY-SPLIT name rather than the raw form value: the caller splits
 * it with lib/newsletter/subscribe's splitName, so the board and the Resend
 * audience always agree on where a surname begins. Keeping the split out of here
 * also leaves this module free of runtime imports, which is what lets it be unit
 * tested under the bare Node runner (Next's "@/" alias does not resolve there).
 */
export function buildSubscriberItem(
  subscriber: { firstName: string; lastName: string; email: string },
  subscribedAt: Date,
): { itemName: string; columnValues: ColumnValues } {
  const columnValues: ColumnValues = {
    [COL.email]: { email: subscriber.email, text: subscriber.email },
    [COL.dateReceived]: { date: toMondayDate(subscribedAt) },
  };
  // Only send Last Name when there is one — a single-token name must not write
  // an empty string over the column.
  if (subscriber.lastName) columnValues[COL.lastName] = subscriber.lastName;
  return { itemName: subscriber.firstName || subscriber.email, columnValues };
}

import { z } from "zod";

/**
 * "Real email" enforcement (shared client + server):
 *   1. A strict RFC-ish pattern — a real local part, a dotted domain, and a
 *      2+ letter TLD (rejects "a@b", "a@b.c", trailing/leading/double dots).
 *   2. A block-list of common disposable / throwaway email providers, so people
 *      can't submit a burner address that won't reach them.
 * Syntactic checks can't prove deliverability, but together these reject the
 * fake and throwaway addresses that account for essentially all bad input.
 */
const STRICT_EMAIL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "nada.email",
  "trashmail.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "mintemail.com",
  "mohmal.com",
  "spamgourmet.com",
  "mytemp.email",
  "emailondeck.com",
  "moakt.com",
  "burnermail.io",
  "discard.email",
  "1secmail.com",
  "spam4.me",
  "trbvm.com",
  "inboxbear.com",
  "harakirimail.com",
]);

/** True if the email's domain is a known disposable / throwaway provider. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(email.slice(at + 1).toLowerCase().trim());
}

/**
 * Contact form validation, shared client + server (the server re-validates the
 * raw payload — never trust the client). Phone is intentionally lenient (accepts
 * spaces, parens, hyphens, +country code) and only requires at least 10 digits.
 *
 * `website` is a honeypot: it is visually hidden and off the tab order, so a
 * real user never fills it. `company` is a genuine optional field (Company or
 * Brokerage) — do NOT use it as the honeypot.
 */
export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    // Strict shape: real local part + dotted domain + 2+ letter TLD.
    .refine((v) => STRICT_EMAIL.test(v), "Enter a valid email address.")
    // Reject disposable / throwaway inboxes — we need a real address.
    .refine((v) => !isDisposableEmail(v), "Please use a permanent email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  isBroker: z.enum(["yes", "no"], { message: "Please choose Yes or No." }),
  heardAbout: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Please enter a message.").max(4000),
  // Honeypot — must stay empty. Bots fill it; humans never see it.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Client-side form state. Widens the two required enums to allow an empty
 * initial value ("nothing selected yet"), which the schema then rejects with a
 * friendly message if the user submits without choosing.
 */
export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  isBroker: "yes" | "no" | "";
  heardAbout: string;
  message: string;
  website: string;
};

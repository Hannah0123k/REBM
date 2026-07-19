import { z } from "zod";

/**
 * Reason-for-contact options (required). Order is the display order.
 */
export const REASON_OPTIONS = [
  "I am looking for a real estate broker",
  "I am a broker interested in joining",
  "Partnership inquiry",
  "General question",
  "Technical support",
  "Other",
] as const;

export type ReasonOption = (typeof REASON_OPTIONS)[number];

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
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  reason: z.enum(REASON_OPTIONS, { message: "Please choose a reason for contact." }),
  isBroker: z.enum(["yes", "no"], { message: "Please choose Yes or No." }),
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
  reason: ReasonOption | "";
  isBroker: "yes" | "no" | "";
  message: string;
  website: string;
};

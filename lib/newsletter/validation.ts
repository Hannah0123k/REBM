import { z } from "zod";

import { isDisposableEmail } from "@/lib/contact/validation";

/**
 * Newsletter signup validation, shared client + server (the server re-validates
 * the raw payload — never trust the client). Two fields only: a full name and a
 * real email address. Email enforcement reuses the SAME strict pattern +
 * disposable-domain block-list the contact form uses (single source of truth in
 * lib/contact/validation), so a burner address can't slip in here either.
 *
 * `website` is a honeypot: visually hidden and off the tab order, so a real
 * subscriber never fills it. A filled honeypot is silently accepted (no signal
 * to the bot) but never subscribed.
 */
const STRICT_EMAIL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const newsletterSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .refine((v) => STRICT_EMAIL.test(v), "Enter a valid email address.")
    .refine((v) => !isDisposableEmail(v), "Please use a permanent email address."),
  // Honeypot — must stay empty. Bots fill it; humans never see it.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/** Client-side form state (both fields start empty). */
export type NewsletterFormValues = {
  fullName: string;
  email: string;
  website: string;
};

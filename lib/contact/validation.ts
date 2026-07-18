import { z } from "zod";

/**
 * Contact form validation, shared client + server. Phone is intentionally
 * lenient (accepts spaces, parens, hyphens, +country code) — it only requires
 * at least 10 digits. The broker question is a required yes/no.
 */
export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((v) => (v.replace(/\D/g, "").length >= 10), "Enter a valid phone number."),
  isBroker: z.enum(["yes", "no"], { message: "Please choose Yes or No." }),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  // Honeypot — must stay empty. Bots fill it; humans never see it.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

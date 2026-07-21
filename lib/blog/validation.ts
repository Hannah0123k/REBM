import { z } from "zod";

import { isValidSlug } from "@/lib/blog/slug";

/**
 * Server + client validation for a post. The status/date rules mirror the DB:
 *   - published / scheduled require a publish date
 *   - scheduled requires a FUTURE date (enforced here in the action, not a
 *     time-dependent CHECK)
 * SEO length caps match the DB constraints (70 / 320); the UI additionally warns
 * at the recommended 60 / 160.
 */
export const postInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .refine(isValidSlug, "Use lowercase letters, numbers and hyphens only."),
    excerpt: z.string().trim().max(500).optional().or(z.literal("")),
    body: z.object({ type: z.literal("doc") }).passthrough(),
    featured_image_url: z.string().url("Enter a valid image URL.").nullable().optional(),
    featured_image_alt: z.string().trim().max(300).nullable().optional(),
    author_name: z.string().trim().max(120).nullable().optional(),
    // Either a full http(s) URL OR a root-relative app-asset path ("/…"). The
    // author images are now bundled assets (see lib/blog/authors.ts), so the
    // strict .url() would reject their root-relative paths.
    author_image_url: z
      .string()
      .refine(
        (v) => v.startsWith("/") || /^https?:\/\//.test(v),
        "Enter a valid image URL or app-asset path.",
      )
      .nullable()
      .optional(),
    status: z.enum(["draft", "published", "scheduled", "unpublished"]),
    featured: z.boolean(),
    // Tag NAMES (slugs are derived server-side). Deduped/cleaned in the action.
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
    seo_title: z.string().trim().max(70, "SEO title must be 70 characters or fewer.").nullable().optional(),
    meta_description: z
      .string()
      .trim()
      .max(320, "Meta description must be 320 characters or fewer.")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const needsDate = data.status === "published" || data.status === "scheduled";
    if (needsDate && !data.published_at) {
      ctx.addIssue({
        path: ["published_at"],
        code: z.ZodIssueCode.custom,
        message: "A publish date is required to publish or schedule.",
      });
    }
    if (data.status === "scheduled" && data.published_at) {
      if (new Date(data.published_at) <= new Date()) {
        ctx.addIssue({
          path: ["published_at"],
          code: z.ZodIssueCode.custom,
          message: "Scheduled posts need a future date and time.",
        });
      }
    }
  });

export type PostInput = z.infer<typeof postInputSchema>;

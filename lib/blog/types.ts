/** Shared blog types, mirroring the blog_posts table. */

export type PostStatus = "draft" | "published" | "scheduled" | "unpublished";

/** A TipTap document is a JSON object; we keep it loosely typed at the boundary. */
export type TiptapDoc = { type: "doc"; content?: unknown[] };

/** Columns needed for the admin list (no body — keep the list light). */
export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  author_name: string | null;
  author_image_url: string | null;
  status: PostStatus;
  featured: boolean;
  reading_time_minutes: number;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string;
  created_at: string;
};

/** Full record for the editor. */
export type BlogPost = PostListItem & {
  excerpt: string | null;
  body: TiptapDoc;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  seo_title: string | null;
  meta_description: string | null;
};

export const ALL_STATUSES: PostStatus[] = [
  "draft",
  "published",
  "scheduled",
  "unpublished",
];

/** UI label + effective public-visibility for a post (status + dates). */
export function displayStatus(p: {
  status: PostStatus;
  published_at: string | null;
  archived_at: string | null;
}): { label: string; tone: "gray" | "green" | "amber" | "slate" | "red" } {
  if (p.archived_at) return { label: "Archived", tone: "red" };
  switch (p.status) {
    case "published":
      return p.published_at && new Date(p.published_at) > new Date()
        ? { label: "Scheduled", tone: "amber" } // published flag but future date → treat as scheduled
        : { label: "Published", tone: "green" };
    case "scheduled":
      return { label: "Scheduled", tone: "amber" };
    case "unpublished":
      return { label: "Unpublished", tone: "slate" };
    default:
      return { label: "Draft", tone: "gray" };
  }
}

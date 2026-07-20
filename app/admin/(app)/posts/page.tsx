import type { MigrationFlags } from "@/components/admin/MigrationBadge";
import { PostList } from "@/components/admin/PostList";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { PostListItem } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin blog list. Fetches ALL posts (RLS admin read returns every status,
 * including imported drafts). Also joins migration flags from
 * blog_post_imports when that table exists — a missing table (before migration
 * 0004 is applied) is handled gracefully and simply shows no migration badges.
 */
export default async function PostsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, author_name, status, featured, reading_time_minutes, published_at, archived_at, updated_at, created_at",
    )
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as PostListItem[];

  // Migration badges — resilient: any error (incl. relation-not-found before
  // 0004 is applied) yields no flags, never breaks the list.
  const migrationFlags: Record<string, MigrationFlags> = {};
  try {
    const { data: imports } = await supabase
      .from("blog_post_imports")
      .select("post_id, review_required, missing_featured_image, unresolved_image_count, metadata_incomplete")
      .not("post_id", "is", null);
    for (const r of imports ?? []) {
      if (r.post_id) {
        migrationFlags[r.post_id as string] = {
          review_required: Boolean(r.review_required),
          missing_featured_image: Boolean(r.missing_featured_image),
          unresolved_image_count: Number(r.unresolved_image_count) || 0,
          metadata_incomplete: Boolean(r.metadata_incomplete),
        };
      }
    }
  } catch {
    // table not present yet — no badges
  }

  return (
    <div>
      {error ? (
        <p className="rounded-[10px] bg-red-50 px-[14px] py-[12px] text-[14px] text-red-700">
          Couldn’t load posts: {error.message}
        </p>
      ) : (
        <PostList initialPosts={posts} migrationFlags={migrationFlags} />
      )}
    </div>
  );
}

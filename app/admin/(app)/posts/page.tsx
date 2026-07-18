import { PostList } from "@/components/admin/PostList";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { PostListItem } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

/** Admin blog list. Fetches all posts (RLS admin read) without the body. */
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

  return (
    <div>
      {error ? (
        <p className="rounded-[10px] bg-red-50 px-[14px] py-[12px] text-[14px] text-red-700">
          Couldn’t load posts: {error.message}
        </p>
      ) : (
        <PostList initialPosts={posts} />
      )}
    </div>
  );
}

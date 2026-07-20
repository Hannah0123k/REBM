import { notFound } from "next/navigation";

import { PostEditor } from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { BlogPost } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (!data) notFound();

  const { data: tagRows } = await supabase
    .from("blog_post_tags")
    .select("tags(name)")
    .eq("post_id", id);
  const initialTags = [
    ...new Set(
      (tagRows ?? []).flatMap((row) => {
        const t = (row as { tags?: { name?: string } | { name?: string }[] }).tags;
        return (Array.isArray(t) ? t : t ? [t] : []).map((x) => x?.name).filter(Boolean) as string[];
      }),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return <PostEditor post={data as BlogPost} initialTags={initialTags} />;
}

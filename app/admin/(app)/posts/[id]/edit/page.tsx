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

  return <PostEditor post={data as BlogPost} />;
}

import { PostEditor } from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function NewPostPage() {
  await requireAdmin();
  return <PostEditor />;
}

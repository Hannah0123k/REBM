import { redirect } from "next/navigation";

/**
 * /admin lands straight on Blog Posts — the CMS's only active surface — instead
 * of a separate dashboard. (The dashboard was a Phase-1 placeholder; the other
 * modules aren't built yet, so there's nothing to land on but posts.)
 */
export default function AdminIndexPage() {
  redirect("/admin/posts");
}

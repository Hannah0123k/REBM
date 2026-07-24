import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Guarded admin shell. This layout wraps every authenticated CMS route (route
 * group "(app)" — the URL stays /admin/...). requireAdmin() re-checks auth AND
 * active-admin status server-side on every request here, independent of the
 * proxy gate. The login page lives outside this group, so it isn't guarded. The
 * chrome (top bar + desktop sidebar / mobile drawer) lives in AdminShell.
 */
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}

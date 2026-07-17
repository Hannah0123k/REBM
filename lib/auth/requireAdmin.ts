import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side authorization gate. Verifies BOTH:
 *   1. a valid authenticated session (auth.getUser — validated with the server)
 *   2. the user is an active administrator (public.is_active_admin RPC, which
 *      reads admin_users under a SECURITY DEFINER function — never a client role)
 *
 * Use in the admin layout AND at the top of every mutation (Server Action /
 * Route Handler). The proxy gate is not sufficient authorization on its own.
 *
 * Returns the authenticated admin user, or redirects to /admin/login.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("is_active_admin");
  if (error || isAdmin !== true) {
    // Authenticated but not authorized — end the session and bounce out.
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  return user;
}

/** Non-redirecting check for use inside actions that return an error object. */
export async function isAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: isAdmin } = await supabase.rpc("is_active_admin");
  return isAdmin === true;
}

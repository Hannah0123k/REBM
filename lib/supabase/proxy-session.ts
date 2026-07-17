import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

/**
 * Runs in the Next 16 Proxy (proxy.ts) on every matched request. It:
 *   1. Refreshes the Supabase auth cookie so sessions stay alive site-wide.
 *   2. Route-gates: any unauthenticated /admin/* request (except /admin/login)
 *      is redirected to /admin/login.
 *
 * This is the FIRST gate only — it proves a session exists, not that the user
 * is an authorized admin. Admin authorization is re-checked server-side in the
 * (app) layout and in every mutation via requireAdmin()/is_active_admin().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before the project is configured, don't touch auth — just gate /admin so
  // the app still builds and runs.
  if (!supabaseConfigured) {
    if (isProtectedAdminPath(request)) return redirectToLogin(request);
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() (not getSession()) — it validates the token with the
  // auth server rather than trusting a possibly-stale cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedAdminPath(request)) return redirectToLogin(request);

  return response;
}

function isProtectedAdminPath(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

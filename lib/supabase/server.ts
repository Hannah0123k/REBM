import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * `cookies()` is async in Next 16, so this helper is async. The `setAll` writes
 * are wrapped in try/catch because cookie writes are only allowed in Actions /
 * Route Handlers, not while rendering a Server Component — the proxy refreshes
 * the session cookie in those read-only cases instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — safe to ignore; the proxy
          // (proxy.ts) keeps the session cookie fresh.
        }
      },
    },
  });
}

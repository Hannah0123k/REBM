import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Supabase client for PUBLIC, UNAUTHENTICATED reads (the blog).
 *
 * Why this exists rather than reusing lib/supabase/server.ts: that helper reads
 * `cookies()` to carry the visitor's session, and ANY access to `cookies()`
 * opts the whole route out of static rendering. The public blog has no session
 * to carry — every row it shows is readable by the `anon` role under RLS
 * (migration 0001/0002: `blog_public_read`, `tags_public_read`,
 * `post_tags_public_read`, `slugs_public_read`) — so paying that cost meant
 * /blog re-rendered and re-queried Supabase on every single request. Measured
 * against production before this change: the homepage served from cache at
 * ~0.17s TTFB while /blog was `x-vercel-cache: MISS` every time at 0.28-0.99s
 * TTFB and up to 2.4s total.
 *
 * Being cookie-free lets the blog routes be cached/revalidated instead. It does
 * NOT weaken visibility: RLS still gates every row, and lib/blog/queries.ts
 * repeats the published/scheduled/not-archived predicate explicitly on top.
 *
 * Never use this for admin reads or anything that must respect the signed-in
 * user — it is deliberately session-less. Use lib/supabase/server.ts there.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

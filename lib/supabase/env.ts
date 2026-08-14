/**
 * Public Supabase config. Both values are safe in the browser bundle — the
 * anon/publishable key grants nothing on its own; Row Level Security enforces
 * all access. The service-role key is NEVER read here or anywhere in the app.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Accept EITHER env name: the legacy `ANON_KEY` or Supabase's newer
// `PUBLISHABLE_KEY` (current dashboards issue the latter). Prefer ANON when both
// are set. Without this, a project configured with only the publishable-key name
// left this empty — silently disabling the shared rate limiter and any
// Supabase-backed feature. Both are safe in the browser (RLS enforces access).
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

/** True once the project env vars are set — lets the UI show a helpful notice. */
export const supabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

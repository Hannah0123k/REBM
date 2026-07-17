/**
 * Public Supabase config. Both values are safe in the browser bundle — the
 * anon/publishable key grants nothing on its own; Row Level Security enforces
 * all access. The service-role key is NEVER read here or anywhere in the app.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the project env vars are set — lets the UI show a helpful notice. */
export const supabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

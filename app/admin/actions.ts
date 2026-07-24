"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

/**
 * Admin sign-in. Server Action — credentials never touch the client bundle and
 * the password is never logged. Two gates:
 *   1. Supabase verifies the password (server-managed session cookie).
 *   2. The user must be an active admin; if not, we sign them straight back out.
 * The error message is intentionally GENERIC so it never reveals whether an
 * email exists or whether an account is an admin.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  const { data: isAdmin } = await supabase.rpc("is_active_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "Invalid email or password." };
  }

  redirect("/admin/posts");
}

/** Sign out and return to the login screen. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

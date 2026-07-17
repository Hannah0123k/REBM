"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "@/app/admin/actions";

const initial: SignInState = { error: null };

/**
 * Admin login form. Uses useActionState (React 19) so the Server Action handles
 * the credentials — nothing sensitive runs in the browser. Shows a loading
 * state and a generic error. No signup / forgot-password links (not offered).
 */
export function LoginForm({ notAuthorized }: { notAuthorized?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initial);
  const error = state.error ?? (notAuthorized ? "Invalid email or password." : null);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-medium text-rebm-navy">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="rounded-[10px] border border-rebm-card-border bg-white px-[14px] py-[11px] text-[16px] text-black outline-none focus:border-rebm-blue"
        />
      </label>

      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-medium text-rebm-navy">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="rounded-[10px] border border-rebm-card-border bg-white px-[14px] py-[11px] text-[16px] text-black outline-none focus:border-rebm-blue"
        />
      </label>

      {error && (
        <p role="alert" className="text-[14px] text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-[4px] rounded-full bg-rebm-navy px-[24px] py-[12px] text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

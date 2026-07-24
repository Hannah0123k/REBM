import Image from "next/image";

import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminUser } from "@/lib/auth/requireAdmin";
import { supabaseConfigured } from "@/lib/supabase/env";
import logo from "@/public/assets/rebm-logo.svg";
import { redirect } from "next/navigation";

/**
 * Admin login. Server Component wrapper: if an admin is already signed in it
 * redirects straight to the dashboard; otherwise it renders the client form.
 * Lives OUTSIDE the guarded (app) layout so it isn't caught by requireAdmin.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (supabaseConfigured && (await isAdminUser())) redirect("/admin/posts");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-[24px] py-[64px]">
      <div className="w-full max-w-[420px] rounded-[20px] border border-rebm-card-border bg-white p-[40px] shadow-sm">
        <Image
          src={logo}
          alt="Real Estate Broker Match"
          width={458}
          height={35}
          priority
          className="mb-[28px] h-auto w-[240px]"
        />
        <h1 className="mb-[6px] text-[24px] font-bold text-rebm-navy">Admin sign in</h1>
        <p className="mb-[24px] text-[14px] text-[rgb(30,41,59)]">
          Sign in to manage the website content.
        </p>

        {!supabaseConfigured && (
          <p className="mb-[16px] rounded-[10px] bg-amber-50 px-[12px] py-[10px] text-[13px] text-amber-800">
            Supabase isn’t configured yet — add the project env vars to enable sign in.
          </p>
        )}

        <LoginForm notAuthorized={error === "not_authorized"} />
      </div>
    </main>
  );
}

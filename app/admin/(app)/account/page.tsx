import { signOut } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

/**
 * Account page. Shows the signed-in admin's email and a Sign Out control.
 * Profile / password management can be added later.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-[560px]">
      <h1 className="text-[28px] font-bold text-rebm-navy">Account</h1>

      <dl className="mt-[24px] rounded-[14px] border border-rebm-card-border bg-white p-[24px]">
        <dt className="text-[13px] font-medium text-[rgb(120,130,140)]">Signed in as</dt>
        <dd className="mt-[4px] text-[16px] text-rebm-navy">{user?.email ?? "—"}</dd>
      </dl>

      <form action={signOut} className="mt-[20px]">
        <button
          type="submit"
          className="rounded-full bg-rebm-navy px-[24px] py-[11px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

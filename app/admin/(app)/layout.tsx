import Image from "next/image";
import Link from "next/link";

import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import logo from "@/public/assets/rebm-logo.svg";

/**
 * Guarded admin shell. This layout wraps every authenticated CMS route (route
 * group "(app)" — the URL stays /admin/...). requireAdmin() re-checks auth AND
 * active-admin status server-side on every request here, independent of the
 * proxy gate. The login page lives outside this group, so it isn't guarded.
 */
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <header className="flex h-[64px] items-center border-b border-rebm-card-border bg-white px-[20px]">
        <Link href="/admin" className="shrink-0">
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={35}
            priority
            className="h-auto w-[220px]"
          />
        </Link>
        <span className="ml-[12px] rounded-full bg-[#F0F2F4] px-[10px] py-[3px] text-[12px] font-medium text-rebm-navy">
          CMS
        </span>
        <Link
          href="/"
          className="ml-auto text-[14px] text-rebm-navy underline-offset-2 hover:underline"
        >
          View site ↗
        </Link>
      </header>

      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-[32px]">{children}</main>
      </div>
    </div>
  );
}

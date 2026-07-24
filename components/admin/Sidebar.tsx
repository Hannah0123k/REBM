"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/admin/actions";

/**
 * CMS navigation — the active surfaces only (Blog Posts + Account). The former
 * "Coming Soon" placeholders and the separate Dashboard were removed. Rendered
 * both in the desktop sidebar and inside the mobile drawer (see AdminShell);
 * `onNavigate` lets the drawer close itself when a link is tapped.
 */
const ITEMS: { label: string; href: string }[] = [
  { label: "Blog Posts", href: "/admin/posts" },
  { label: "Account", href: "/admin/account" },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col justify-between">
      <nav className="p-[16px]">
        <p className="mb-[8px] px-[12px] text-[11px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">
          Content
        </p>
        <ul className="flex flex-col gap-[2px]">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block rounded-[8px] px-[12px] py-[10px] text-[15px] transition-colors ${
                  isActive(item.href)
                    ? "bg-rebm-navy font-medium text-white"
                    : "text-rebm-navy hover:bg-[#F0F2F4]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form action={signOut} className="border-t border-rebm-card-border p-[16px]">
        <button
          type="submit"
          className="w-full rounded-[10px] border border-rebm-card-border px-[16px] py-[10px] text-[15px] font-medium text-rebm-navy transition-colors hover:bg-[#F0F2F4]"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/admin/actions";

/**
 * Website-CMS sidebar. Structured for future expansion — only Dashboard, Blog
 * Posts and Account are active now; the rest are disabled "Coming Soon"
 * placeholders so the information architecture is set without building them yet.
 */
type Item = { label: string; href?: string; soon?: boolean };

const SECTIONS: { heading: string; items: Item[] }[] = [
  {
    heading: "Content",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Blog Posts", href: "/admin/posts" },
      { label: "Media Library", soon: true },
      { label: "Testimonials", soon: true },
      { label: "FAQs", soon: true },
      { label: "Team Members", soon: true },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "SEO Settings", soon: true },
      { label: "Account", href: "/admin/account" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href?: string) =>
    href === "/admin" ? pathname === "/admin" : !!href && pathname.startsWith(href);

  return (
    <aside className="flex w-[248px] shrink-0 flex-col justify-between border-r border-rebm-card-border bg-white">
      <nav className="flex flex-col gap-[24px] p-[20px]">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="mb-[8px] px-[12px] text-[11px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">
              {section.heading}
            </p>
            <ul className="flex flex-col gap-[2px]">
              {section.items.map((item) =>
                item.soon || !item.href ? (
                  <li
                    key={item.label}
                    aria-disabled="true"
                    className="flex items-center justify-between rounded-[8px] px-[12px] py-[9px] text-[15px] text-[rgb(160,168,176)]"
                  >
                    {item.label}
                    <span className="rounded-full bg-[#F0F2F4] px-[7px] py-[2px] text-[10px] font-medium text-[rgb(140,148,156)]">
                      Soon
                    </span>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`block rounded-[8px] px-[12px] py-[9px] text-[15px] transition-colors ${
                        isActive(item.href)
                          ? "bg-rebm-navy font-medium text-white"
                          : "text-rebm-navy hover:bg-[#F0F2F4]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </nav>

      <form action={signOut} className="border-t border-rebm-card-border p-[20px]">
        <button
          type="submit"
          className="w-full rounded-[10px] border border-rebm-card-border px-[16px] py-[10px] text-[15px] font-medium text-rebm-navy transition-colors hover:bg-[#F0F2F4]"
        >
          Sign Out
        </button>
      </form>
    </aside>
  );
}

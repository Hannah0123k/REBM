"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SidebarNav } from "@/components/admin/Sidebar";
import logo from "@/public/assets/rebm-logo.svg";

/**
 * Admin shell: top bar + navigation + content. On desktop (lg+) the nav is a
 * fixed left sidebar. On mobile there is NO persistent sidebar — a hamburger in
 * the top bar opens the nav as a drawer (portal overlay, Escape / click-outside
 * to close, background scroll-locked), so the content gets the full width and
 * isn't squeezed. Auth is enforced in the server layout that renders this.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <header className="flex h-[64px] items-center gap-[10px] border-b border-rebm-card-border bg-white px-[14px] sm:px-[20px]">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] text-rebm-navy hover:bg-[#F0F2F4] lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link href="/admin/posts" className="shrink-0">
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={35}
            priority
            className="h-auto w-[160px] sm:w-[220px]"
          />
        </Link>
        <span className="ml-[8px] hidden rounded-full bg-[#F0F2F4] px-[10px] py-[3px] text-[12px] font-medium text-rebm-navy sm:inline">
          CMS
        </span>
        <Link href="/" className="ml-auto text-[14px] text-rebm-navy underline-offset-2 hover:underline">
          View site ↗
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-[248px] shrink-0 border-r border-rebm-card-border bg-white lg:block">
          <SidebarNav />
        </aside>

        <main className="min-w-0 flex-1 p-[16px] sm:p-[24px] lg:p-[32px]">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin menu"
              className="absolute inset-y-0 left-0 flex w-[264px] max-w-[82%] flex-col bg-white shadow-2xl"
            >
              <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-rebm-card-border px-[16px]">
                <span className="text-[13px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex size-[36px] items-center justify-center rounded-full text-[22px] text-rebm-navy hover:bg-[#F0F2F4]"
                >
                  ×
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}

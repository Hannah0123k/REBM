"use client";

import Link from "next/link";
import { useState } from "react";

import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";

/**
 * Hamburger + full-screen drawer for viewports below xl, where the 7-link
 * desktop nav no longer fits. Not in Figma or the live design (both are
 * desktop-only frames) — a necessary responsive addition. Navy overlay, stacked
 * links, phone pill, matching the header's language.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[60] flex size-[44px] items-center justify-center"
      >
        <span className="sr-only">Menu</span>
        <div className="flex w-[26px] flex-col gap-[6px]">
          <span className={`h-[2px] w-full bg-white transition-transform ${open ? "translate-y-[8px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-full bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-full bg-white transition-transform ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-[28px] bg-rebm-navy/95 backdrop-blur">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[24px] leading-[32px] text-white transition-opacity hover:opacity-80"
            >
              {link.label}
            </Link>
          ))}
          <PhonePill className="mt-[8px]" />
        </div>
      )}
    </div>
  );
}

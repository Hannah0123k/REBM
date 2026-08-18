"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";

/**
 * Hamburger + full-screen drawer for viewports below xl, where the 7-link
 * desktop nav no longer fits. Not in Figma or the live design (both are
 * desktop-only frames) — a necessary responsive addition. Navy overlay, stacked
 * links, phone pill, matching the header's language.
 *
 * Treated as a dialog for keyboard/AT users: Escape closes it, body scroll is
 * locked while open, focus moves into the drawer on open and returns to the
 * hamburger on close.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    // Lock body scroll behind the overlay.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the drawer.
    firstLinkRef.current?.focus();
    // Escape closes.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    // Return focus to the trigger for keyboard users.
    buttonRef.current?.focus();
  };

  // Same-page anchor links (`/#faq`, …) must NOT rely on the browser's native
  // hash scroll: it fires while the drawer still has the body scroll-locked, so
  // it lands short (the deeper the section, the further off — e.g. FAQ stopped
  // ~180px above target). Instead we close the drawer, then scroll on the next
  // frames once the lock has lifted and layout has settled. scrollIntoView
  // honors each section's CSS scroll-margin-top, so it lands under the header.
  const onNavClick = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const id = href.startsWith("/#") ? href.slice(2) : null;
    const target = id ? document.getElementById(id) : null;
    if (!target) {
      close(); // real route (Blog/Contact) or not on the homepage — navigate normally
      return;
    }
    e.preventDefault();
    close();
    // "auto" (instant), matching the desktop nav — a tapped link opens the page
    // at that section rather than animating the whole way down to it. The two
    // rAFs are still needed: they wait for the drawer's body scroll-lock to lift
    // so the jump lands on target rather than short.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }),
    );
  };

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="relative z-[60] flex size-[44px] items-center justify-center rounded-[6px] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <span className="sr-only">Menu</span>
        <div className="flex w-[26px] flex-col gap-[6px]">
          <span className={`h-[2px] w-full bg-white transition-transform ${open ? "translate-y-[8px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-full bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-full bg-white transition-transform ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
        </div>
      </button>

      {/* Portaled to <body> so the fixed overlay covers the FULL viewport. The
          fixed header uses backdrop-filter when scrolled, which makes it a
          containing block for fixed descendants — rendering the drawer inside it
          trapped the overlay to the 72px header and let the page show through.
          At body level it always covers the screen. */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-[28px] bg-gradient-to-b from-[#0a2839] to-[#164863]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="absolute top-[22px] right-[24px] flex size-[44px] items-center justify-center rounded-[6px] text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                ref={i === 0 ? firstLinkRef : undefined}
                href={link.href}
                onClick={onNavClick(link.href)}
                className="rounded-[4px] px-[12px] py-[6px] text-[24px] leading-[32px] text-white transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                {link.label}
              </Link>
            ))}
            <PhonePill className="mt-[10px]" />
          </div>,
          document.body,
        )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "@/components/Container";
import { MobileNav } from "@/components/MobileNav";
import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo.svg";

/**
 * Sticky site header — shared by every page. Live site is fixed + transparent;
 * we keep it fixed but fade in a solid brand-blue background after a little
 * scroll so the white nav text stays legible over the light sections below the
 * hero (the live site's transparent-always header has this legibility problem).
 *
 * Height is --header-h (globals.css); every [id] anchor uses it as
 * scroll-margin-top, so in-page jumps land below the header, not under it.
 *
 * Logo sizing measured from the live site: 458×67 at ≥1536, 340×50 at 1280–1440.
 * Nav shows from xl (1280) up; below that, the hamburger drawer.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-colors duration-300 ${
        scrolled ? "bg-rebm-blue shadow-md" : "bg-transparent"
      }`}
    >
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={67}
            priority
            className="h-auto w-[240px] sm:w-[300px] xl:w-[340px] 2xl:w-[458px]"
          />
        </Link>

        {/* Live nav: 24px between links, 40px before the phone pill. */}
        <nav className="hidden items-center gap-[40px] xl:flex">
          <ul className="flex items-center gap-[20px] 2xl:gap-[24px]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="whitespace-nowrap text-[18px] leading-[30px] text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <PhonePill />
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}

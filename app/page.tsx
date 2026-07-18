import { Footer } from "@/components/Footer";
import { Bios } from "@/components/home/Bios";
import { Hero } from "@/components/home/Hero";
import { Introduce } from "@/components/home/Introduce";
import { LuckCta } from "@/components/home/LuckCta";
import { Markets } from "@/components/home/Markets";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { ValueProps } from "@/components/home/ValueProps";

/**
 * Homepage — section order matches the live site exactly (CLAUDE.md → 2026-07-17
 * correction). Live is the source of truth for order, content, and images;
 * Figma governs visual style only.
 *
 *   1 Hero              6 Markets We Serve
 *   2 Bios              7 Introduce ("REBM can also introduce you to")
 *   3 Process           8 Testimonials + FAQ (FAQ renders inside Testimonials)
 *   4 LuckCta           9 Footer
 *   5 ValueProps
 */
export default function Home() {
  return (
    <>
      {/* Primary-content landmark so assistive tech (and the skip link) can jump
          past the fixed header straight to the page body. Footer is its own
          <footer> landmark and stays outside. */}
      <main id="main-content">
        <Hero />
        <Bios />
        <Process />
        <LuckCta />
        <ValueProps />
        <Markets />
        <Introduce />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

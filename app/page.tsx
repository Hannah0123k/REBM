import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { LuckCta } from "@/components/home/LuckCta";
import { Process } from "@/components/home/Process";

/**
 * Homepage. Sections are built one at a time against Figma frame 95:2 and
 * appended here in order. Remaining: bios (y 2306.5), value props (3341.5),
 * property types (4206.5), "REBM Can" (6325.5), testimonials (6773.5),
 * legal band (8976.5), FAQ (live-site design — no Figma frame exists).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Process />
      <LuckCta />
      <Footer />
    </>
  );
}

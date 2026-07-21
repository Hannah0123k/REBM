import Image from "next/image";

import { Container } from "@/components/Container";
import { PillButton } from "@/components/PillButton";
import { Reveal } from "@/components/Reveal";
import { luckCta } from "@/content/homepage";
import bandPhoto from "@/public/assets/band-photo.webp";

/**
 * "Finding the right broker on Google is luck…" bar — EXACT Figma design
 * (Rectangle 9 + Frame 10, Figma frame 95:2 y 1858.5 → 2306.5).
 *
 * Figma:
 *   bg      Rectangle 9 (95:8)  1920×448  #4C84B7
 *   photo   image 3 (95:9)      10% opacity behind
 *   content Frame 10 centred; padding 100 top / 90 bottom; min-height 448
 *   H2      95:48  HND-Bd 32/41.6  #FFFFFF  CENTER
 *   body    95:49  HN 24/31.2  #FFFFFF  CENTER
 *   gaps    H2→body 24 · body→button 24
 *   button  95:50  225×64 radius 80  #032C40 @0.9
 *
 * Content is the live wording (source of truth); the heading keeps the requested
 * two-line break. Typography/proportions are Figma.
 */
export function LuckCta() {
  return (
    <section className="relative w-full overflow-hidden bg-rebm-band-cta">
      {/* image 3 at 10% opacity (Figma). Stretched full width like the node. */}
      <Image
        src={bandPhoto}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-10 select-none"
      />

      {/* Vertically centred with equal top/bottom padding, so the space below
          the content matches the space above it (symmetric band). */}
      <Container className="relative flex flex-col justify-center py-[56px] lg:min-h-[448px] lg:py-[100px]">
        <Reveal className="flex flex-col items-center text-center" stagger={0.1}>
          <h2 className="max-w-[720px] text-[29px] leading-[36px] font-bold text-white lg:text-[32px] lg:leading-[41.6px]">
            {luckCta.headingLines.map((line, i) => (
              <span key={line}>
                {line}
                {i < luckCta.headingLines.length - 1 && <br />}
              </span>
            ))}
          </h2>

          <p className="mt-[24px] max-w-[988px] text-[18px] leading-[25px] text-white lg:text-[24px] lg:leading-[31.2px]">
            {luckCta.body}
          </p>

          <PillButton href={luckCta.cta.href} className="mt-[24px]">
            {luckCta.cta.label}
          </PillButton>
        </Reveal>
      </Container>
    </section>
  );
}

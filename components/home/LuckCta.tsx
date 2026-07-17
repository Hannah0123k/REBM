import Image from "next/image";

import { PillButton } from "@/components/PillButton";
import { luckCta } from "@/content/homepage";
import bandPhoto from "@/public/assets/band-photo.webp";

/**
 * "Finding the perfect broker on Google is luck…" CTA band.
 * Figma frame 95:2, y 1858.5 → 2306.5 (Rectangle 9, 1920×448, #4C84B7).
 *
 * Geometry, exact from Figma:
 *   band    Rectangle 9 (95:8)   y=1858.5  1920×448  #4C84B7
 *   photo   image 3 (95:9)       y=1318.5  1920×988  opacity 0.10  STRETCH
 *   H2      95:48                x=626  y=1958.5  668 wide  HND-Bd 32/41.6  centred
 *   body    95:49                x=466  y=2066.5  988 wide  HN 24/31.2      centred
 *   button  95:50                x=847.5 y=2152.5  225×64
 *
 * Derived: band top → H2 = 100 · H2 → body = 24 · body → button = 24 · bottom = 90.
 * H2, body and button all centre on x=960, so the column is simply centred.
 *
 * image 3 is a 988-tall node that starts 540px ABOVE this band — its upper half
 * is hidden behind the white section above (Rectangle 6 sits on top of it in
 * z-order). Only its bottom 448px are ever visible, so it is offset -540 here.
 * scaleMode is STRETCH, not FILL, hence object-fill: Figma squashes the 1920×1280
 * source into 1920×988 rather than cropping it.
 *
 * The same source also backs the "REBM Can" band at 5% opacity — one asset, two
 * bands.
 */
export function LuckCta() {
  return (
    <section className="relative w-full overflow-hidden bg-rebm-band-cta">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <Image
          src={bandPhoto}
          alt=""
          className="absolute top-[-540px] h-[988px] w-full object-fill opacity-10"
        />
      </div>

      <div className="relative flex min-h-[448px] flex-col items-center pt-[100px] pb-[90px] text-center">
        <h2 className="w-[668px] font-display text-[32px] leading-[41.6px] font-bold text-white">
          {luckCta.heading}
        </h2>

        <p className="mt-[24px] w-[988px] text-[24px] leading-[31.2px] text-white">
          {luckCta.body}
        </p>

        <PillButton href={luckCta.cta.href} className="mt-[24px]">
          {luckCta.cta.label}
        </PillButton>
      </div>
    </section>
  );
}

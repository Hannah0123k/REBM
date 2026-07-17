import Image from "next/image";

import { PillButton } from "@/components/PillButton";
import { SiteHeader } from "@/components/SiteHeader";
import { hero, serviceOverview } from "@/content/homepage";
import heroPhoto from "@/public/assets/hero-photo.webp";

/**
 * Hero + the dark info band beneath it (Figma frame 95:2, y 0 → 1012.5).
 *
 * Geometry, exact from Figma:
 *   photo   image 2 (116:2)  x=176  y=-76.5  1745×1091
 *   H1      95:23            x=188  y=149.5  775 wide   HND-Bd 62/80.6  #FFFFFF
 *   body    95:24            x=188  y=424.5  577 wide   HN-Medium 24/31.2
 *   button  131:5            x=188  y=673.5  225×64
 *   band    Rectangle 5      x=0    y=786.5  1920×226   #0E384F @ 0.5
 *   left    95:40            x=188  y=853.5  782 wide   HN 18/23.4
 *   rule    Line 1 (95:41)   x=1054 y=850.5  98 tall    white
 *   right   95:38            x=1104 y=853.5  617 wide   HN 18/23.4
 *
 * ── The mirror ─────────────────────────────────────────────────────────────
 * image 2 reports `rotation: π` from the REST API, but it is NOT rotated 180° —
 * it is mirrored horizontally. Figma decomposes a horizontal flip ambiguously
 * (180° rotation + vertical flip ≡ horizontal mirror), and taking the reported
 * rotation literally renders the building upside down.
 *
 * Ground truth: the source photo is upright with the building on the LEFT; the
 * design shows it upright with the building on the RIGHT. That is scaleX(-1).
 *
 * So the wrapper is mirrored and the children use Figma's authored values
 * verbatim. Figma's fills, in node space, bottom-most first:
 *   1. IMAGE, scaleMode FILL
 *   2. linear, bottom→top:  #80B3E2 alpha 0 @80%  → alpha 1 @100%
 *   3. linear, left→right:  #689ECF alpha 0 @25%  → alpha 1 @100%
 * Mirrored, #689ECF lands opaque on the left (confirmed by pixel-scanning the
 * Figma render) while #80B3E2 stays at the top, unaffected by a horizontal flip.
 *
 * Gradients are CSS rather than baked into the export because the section grows:
 * live copy is ~40% longer than Figma's placeholder (the H1 needs 4 lines where
 * Figma drew 3), and a baked gradient can't reflow — it left the dark band
 * hanging off the bottom of the photo.
 *
 * Vertical rhythm is flow-based, not absolute, for the same reason. Every gap
 * below is the exact Figma delta between adjacent boxes.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-rebm-blue">
      {/* image 2 (116:2): x=176, y=-76.5, 1745 wide, bleeding above the frame and
          past its right edge. Height tracks the section so the dark band below
          always lands on photo. -scale-x-100 is the node's mirror — see above;
          children are authored unmirrored. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-76.5px] left-[176px] h-[calc(100%+76.5px)] w-[1745px] -scale-x-100 select-none"
      >
        <Image src={heroPhoto} alt="" priority className="size-full object-fill" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(128,179,226,0) 80%, rgba(128,179,226,1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(104,158,207,0) 25%, rgba(104,158,207,1) 100%)",
          }}
        />
      </div>

      <SiteHeader />

      {/* Hero content — Frame 6 (95:22), x=188 y=149.5 */}
      <div className="relative px-[187px] pt-[149.5px]">
        <h1 className="w-[900px] text-[50px] leading-[70px] font-semibold text-white">
          {hero.heading}
        </h1>

        {/* H1 box ends y=392.5, body starts y=424.5 → 32px gap */}
        <div className="mt-[32px] w-[640px] space-y-[26px] text-[20px] leading-[26px] text-white">
          {hero.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        {/* body box ends y=641.5, button starts y=673.5 → 32px gap */}
        <PillButton href={hero.cta.href} className="mt-[32px]">
          {hero.cta.label}
        </PillButton>
      </div>

      {/* Dark info band — Rectangle 5, y=786.5, 226 tall, over the photo.
          Frame 6 ends y=737.5 → 49px gap. */}
      <div className="relative mt-[49px] min-h-[226px] w-full bg-rebm-band-info">
        <div className="flex px-[187px] pt-[67px]">
          <p className="w-[782px] text-[18px] leading-[23.4px] text-white">
            {serviceOverview.summary}
          </p>

          {/* Line 1: x=1054 (866 past the 188 gutter), 98 tall, starts 64 below
              the band top — i.e. 3px above the text baseline box. */}
          <div
            aria-hidden="true"
            className="mt-[-3px] ml-[84px] h-[98px] w-px shrink-0 bg-white"
          />

          <ul className="ml-[50px] w-[617px] list-disc pl-[18px] text-[18px] leading-[23.4px] text-white marker:text-white">
            {serviceOverview.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

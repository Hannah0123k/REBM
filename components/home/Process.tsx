import Image from "next/image";

import { Container } from "@/components/Container";
import { process } from "@/content/homepage";
import processPhoto from "@/public/assets/process-photo.webp";

/**
 * "Real Estate Broker Match makes finding the right real estate broker simple."
 * — Figma frame 95:2, y 1012.5 → 1858.5 (Rectangle 6, 1920×846, #FFFFFF).
 *
 * Geometry, exact from Figma:
 *   photo   Rectangle 7 (95:73)  x=-11   y=1012.5  1336×846
 *   H2      95:44                x=1125  y=1121.5  605 wide  HND-Bd 32/41.6  #000000
 *   intro   95:46                x=1125  y=1229.5  568 wide  HN 24/31.2      #000000
 *   steps   Group 6 (95:52)      x=1125  y=1423.5  574 wide
 *     Step 1  label y=1423.5 (31 tall) · body y=1462.5 → 8px gap · frame 62 tall
 *     Step 2  y=1509.5 → 24px after Step 1
 *     Step 3  y=1595.5 → 24px after Step 2
 *   step label  HND-Bd 24/31.2  #689ECF
 *   step body   HN-Medium 18/23.4  #000000
 *
 * Derived gaps: section top → H2 = 109 · H2 → intro = 24 · intro → steps = 39.
 *
 * The photo bleeds 11px off the left edge and fades to white on the right via a
 * gradient authored on the node itself (transparent @47.6% → #FFFFFF @88.5%,
 * left→right). That fade is what gives the text a clean white ground, so it is
 * reproduced in CSS rather than baked — the section grows with the copy.
 *
 * Unlike the hero's image 2, this node has NO rotation: the photo is used as-is.
 *
 * Step 3 is shorter than Figma drew it — the live site dropped Figma's second
 * sentence, and live copy wins. See content/homepage.ts.
 */
export function Process() {
  return (
    <section id="process" className="relative w-full overflow-hidden bg-white">
      {/* Rectangle 7: x=-11, full section height, faded to white on the right. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-11px] w-[69.6%] select-none"
      >
        <Image src={processPhoto} alt="" className="size-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 47.6%, rgba(255,255,255,1) 88.5%)",
          }}
        />
      </div>

      {/* Group 34: x=1125, y=1121.5 → 109 below the section top. */}
      <Container className="relative flex min-h-[846px] justify-end pt-[109px]">
        <div className="w-full lg:w-[605px] lg:shrink-0">
        <h2 className="text-[32px] leading-[41.6px] font-bold text-black">
          {process.heading}
        </h2>

        <p className="mt-[24px] text-[24px] leading-[31.2px] text-black">
          {process.intro}
        </p>

        <div className="mt-[39px] space-y-[24px]">
          {process.steps.map((step) => (
            <div key={step.label}>
              <h4 className="text-[24px] leading-[31.2px] font-bold text-rebm-blue">
                {step.label}
              </h4>
              <p className="mt-[8px] text-[18px] leading-[23.4px] font-medium text-black">
                {step.before}
                {step.linkText && (
                  <a
                    href={step.linkHref}
                    className="text-rebm-link underline transition-opacity hover:opacity-70"
                  >
                    {step.linkText}
                  </a>
                )}
                {step.after}
              </p>
            </div>
          ))}
        </div>
        </div>
      </Container>
    </section>
  );
}

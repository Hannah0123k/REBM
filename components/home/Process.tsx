import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { process } from "@/content/homepage";

/**
 * "Real Estate Broker Match makes finding the right real estate broker simple."
 * Live section 3 (y 2080 → 2927, height 846).
 *
 * Image placement matches the live site exactly (and Figma): the building photo
 * is the live asset Group-50-1.png (process-bg.webp, 1931×846) used as a
 * full-bleed SECTION BACKGROUND —
 *   background-size: cover · background-position: 100% 50% · no-repeat
 * The building sits on the left and fades to white on the right (the fade is
 * baked into the PNG), and the text column sits on the clean white right side.
 * No CSS gradient — the asset carries it, like the live site.
 *
 * The background shows from lg up (the live desktop layout); on mobile the
 * section is plain white so the single-column text stays readable.
 *
 * ⚠️ background-position-x MUST stay within 0%–100%. `cover` only guarantees the
 * image covers the box for positions inside that range; anything beyond it (e.g.
 * the `calc(100% + 48px)` "nudge-right" from 154c25d) slides the image off its
 * own box and exposes bare white section on the LEFT. The gap is invisible while
 * the image still overflows horizontally, so it only appears once the viewport
 * passes ~1883 CSS px — i.e. on wide monitors and, far more commonly, when a
 * normal user zooms the browser OUT (90/80/75/67% on a 1920 screen all land
 * above 1883). It is 37px at 1920 and settles at a constant 48px past ~1931.
 * Right-anchoring at 100% is also what makes the section behave correctly as it
 * widens: the image is height-locked, so a wider viewport REVEALS more of the
 * building's left side rather than shrinking or shifting the photo.
 *
 * position-y is 20%, not 50%, purely to protect the tower on ultrawide/zoomed-out
 * viewports. Below ~1931px it is a no-op — the image is height-locked to the 846
 * section so there is no vertical overflow to distribute. Past that, `cover`
 * scales the image UP to fill the width and the excess height gets cropped; at
 * 50% that crop is split evenly and beheads the tower (visible from ~2866px, i.e.
 * 67% browser zoom on a 1920 screen). Biasing the crop to the bottom sacrifices
 * foreground road instead, keeping the tower and its sky in frame.
 *
 * Text (live): H2 Inter 32/41.6 w700 #032C40 · intro 24/31.2 · Step labels
 * 24/31.2 w700 #689ECF · step body 18/23.4 w500. Container justify-end → text
 * pinned right, 605 wide.
 */
export function Process() {
  return (
    <section
      id="process"
      className="relative w-full overflow-hidden bg-white lg:bg-cover lg:bg-[position:100%_20%] lg:bg-no-repeat lg:bg-[url('/assets/live/process-bg.webp')]"
    >
      {/* MOBILE/TABLET: the building photo as a full-width band at the TOP of the
          section (on desktop it's the full-bleed section background instead).
          process-bg.webp bakes a white fade into its right ~43% (building is the
          left ~55%). background-size 184%/left-anchored zooms into the building
          only, so the image FILLS the band with no white gap; the ONLY fade is a
          bottom gradient into the white section below. */}
      <div aria-hidden="true" className="relative h-[220px] w-full overflow-hidden sm:h-[280px] lg:hidden">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/live/process-bg.webp')",
            backgroundSize: "184% auto",
            backgroundPosition: "0% 40%",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[52px] bg-gradient-to-b from-transparent to-white" />
      </div>
      {/* Group 34: x=1125, y=1121.5 → 109 below the section top (desktop). On
          mobile the section is content-height with its own padding (no forced
          846px, so no empty gap before the next section). */}
      <Container className="relative flex flex-col pt-[40px] pb-[56px] lg:min-h-[846px] lg:flex-row lg:justify-end lg:pt-[109px] lg:pb-0">
        <div className="w-full lg:w-[605px] lg:shrink-0">
          {/* Heading + intro slide gently in from the right (fade-up on mobile). */}
          <Reveal x={30} stagger={0.1}>
            <h2 className="text-[29px] leading-[36px] font-bold text-black lg:text-[32px] lg:leading-[41.6px]">
              {process.heading}
            </h2>
            <p className="mt-[24px] text-[18px] leading-[23.4px] text-black lg:text-[24px] lg:leading-[31.2px]">
              {process.intro}
            </p>
          </Reveal>

          {/* Steps 1–3 reveal ONE AT A TIME as each scrolls into view (its own
              Reveal → its own trigger), with a slower entrance — instead of all
              three firing together when the group appears. */}
          <div className="mt-[39px] space-y-[24px]">
            {process.steps.map((step) => (
              <Reveal key={step.label} duration={1.4} start="top 88%">
                <div>
                  {/* h3, not h4 — the section heading above is an h2, so the step
                      labels are the next level down; skipping to h4 broke the
                      document outline. Visual styling is unchanged. */}
                  <h3 className="text-[24px] leading-[31.2px] font-bold text-rebm-blue">
                    {step.label}
                  </h3>
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
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

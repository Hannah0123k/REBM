"use client";

import { useEffect, useRef } from "react";

import { Container } from "@/components/Container";
import { PillButton } from "@/components/PillButton";
import { Reveal } from "@/components/Reveal";
import { hero } from "@/content/homepage";

/**
 * Hero + dark info band. Live section 1 (y 0 → 982).
 *
 * The live site paints the photo as a full-width BACKGROUND image on the hero:
 *   background: #689ECF url(image-2-1.jpg) top-center / 100% auto no-repeat
 * i.e. scaled to viewport width, anchored to the top, bottom cropped by the
 * section height. Reproduced with a background layer rather than an absolutely
 * positioned <img>, so the building never overlaps the headline (it sits behind,
 * faded into blue on the left) and crops with the section like the live site.
 *
 * Live type:
 *   H1     Inter 50/70 w600 #fff, ls -0.2px, 840 wide → 3 lines
 *   body   Inter 20/26 w400 #fff, 580 wide, 26px between the two paragraphs
 *   button primary pill → /contact-us/
 *
 * The header is fixed/global (app/layout.tsx); the hero pads its content down by
 * the header height so the headline clears it.
 *
 * SCROLL-LINKED FADE (GSAP ScrollTrigger, scrub): as the user scrolls into the
 * next section the hero CONTENT fades out and drifts up ~30px, and the building
 * fades to ~0.25 slightly more slowly for a layered feel. The sticky header, the
 * blue wash, and the dark info band are NOT animated — the band stays solid and
 * naturally takes over. Disabled under prefers-reduced-motion (content stays
 * fully visible). The rest of the homepage uses one-time entrance animations
 * (separate; not this scroll effect).
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current;
    const content = contentRef.current;
    const building = buildingRef.current;
    if (!section || !content || !building) return;

    let cleanup = () => {};
    let cancelled = false;

    // Load GSAP + ScrollTrigger on the client only.
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // Complete around where the info band reaches the top portion of
              // the viewport (≈70% down the hero), not the whole section.
              end: "70% top",
              scrub: 0.8,
            },
          });
          // Text fades a touch faster than the building (duration 0.7 vs 1) so
          // the building lingers → subtle layered depth.
          tl.to(content, { opacity: 0, y: -30, ease: "none", duration: 0.7 }, 0);
          tl.to(building, { opacity: 0.25, ease: "none", duration: 1 }, 0);
        }, section);
        cleanup = () => ctx.revert();
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-rebm-blue">
      {/* Photo as a background layer — exactly the live treatment:
          size 100% (width 100%, height auto) · position top-centre · no-repeat.
          Set inline for reliability (the Tailwind arbitrary bg-size didn't apply). */}
      <div
        ref={buildingRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/assets/live/hero-bg.webp')",
          backgroundSize: "100% auto",
          backgroundPosition: "50% 0%",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Left-to-blue wash so the headline keeps contrast regardless of crop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #689ECF 0%, rgba(104,158,207,0.82) 34%, rgba(104,158,207,0) 66%)",
        }}
      />

      {/* Content block: live is padding 150 top / 312 bottom → the tall bottom
          pad is what makes the hero 982 and crops the building to match live. */}
      <Container className="relative pt-[calc(var(--header-h)+42px)] pb-[60px] lg:pb-[44px]">
        {/* Everything inside contentRef fades/drifts on scroll; the header, wash
            and info band stay put. */}
        <div ref={contentRef} className="will-change-[opacity,transform]">
          <h1 className="max-w-[840px] text-[34px] leading-[42px] font-semibold tracking-[-0.2px] text-white sm:text-[44px] sm:leading-[58px] lg:text-[50px] lg:leading-[70px]">
            {hero.headingLines.map((line, i) => (
              <span key={line}>
                {line}
                {/* Force the exact live break on desktop; wrap naturally below. */}
                {i < hero.headingLines.length - 1 && <br className="hidden lg:inline" />}
                {i < hero.headingLines.length - 1 && <span className="lg:hidden"> </span>}
              </span>
            ))}
          </h1>

          <div className="mt-[32px] max-w-[580px] space-y-[26px] text-[20px] leading-[26px] text-white">
            {hero.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <PillButton href={hero.cta.href} className="mt-[32px]">
            {hero.cta.label}
          </PillButton>
        </div>
      </Container>

      {/* Info band — EXACT Figma design (Rectangle 5, 95:36). The Figma node is
          FROSTED GLASS, not a flat overlay: fill #0E384F @ 0.5 PLUS a
          BACKGROUND_BLUR effect (radius 66.67 in the 1920 frame). It sits over
          the hero building photo, so the building shows through blurred and
          navy-tinted — that's the depth.
          Recreated as: a blurred, navy-tinted crop of the same building photo
          filling the strip (own background rather than backdrop-filter, so it
          reads identically regardless of how the hero photo above happens to
          crop). 226 tall, 67px vertical padding, left copy 782 / white divider
          98 / right copy 617, text 18/23.4 white. Live wording; Figma visuals. */}
      <div className="relative w-full overflow-hidden">
        {/* Frosted building behind the tint (blur ≈ 66.67 × render/1920). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 scale-110 bg-[url('/assets/live/hero-bg.webp')] bg-[length:100%_auto] bg-[position:50%_100%] bg-no-repeat blur-[50px]"
        />
        {/* Navy tint #0E384F @ 0.5 over the frosted building. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-rebm-band-info" />

        <Container className="relative flex flex-col gap-[28px] py-[48px] lg:flex-row lg:items-center lg:gap-0 lg:py-[67px]">
          {/* Summary and bullets both fade in on scroll with the same animation.
              Columns share width in the design's 56:44 ratio (grow, basis-0) with
              min-w-0 so they compress together — the old fixed 782px shrink-0 left
              column crushed the right column off-screen at 1024. */}
          <Reveal
            className="text-[18px] leading-[23.4px] text-white lg:min-w-0 lg:basis-0 lg:grow-[56]"
            start="top 88%"
          >
            <p>{hero.band.summary}</p>
          </Reveal>
          <div aria-hidden="true" className="hidden self-stretch lg:mx-[52px] lg:block lg:w-px lg:bg-white" />
          <Reveal
            className="flex flex-col gap-[4px] text-[18px] leading-[23.4px] text-white lg:min-w-0 lg:basis-0 lg:grow-[44]"
            stagger={0.12}
            start="top 88%"
          >
            {hero.band.points.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </Reveal>
        </Container>
      </div>
    </section>
  );
}

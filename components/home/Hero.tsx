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
    // Desktop only — the scroll fade is tied to the full-bleed background photo,
    // which is hidden on mobile/tablet (there the photo is a static band).
    if (window.matchMedia("(max-width: 1023px)").matches) return;
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
      {/* DESKTOP (≥lg) photo treatment — the approved live look: the building as
          a full-bleed background scaled to width, top-anchored, faded left-to-blue
          so the headline keeps contrast. Hidden on mobile/tablet, where the Figma
          mobile layout instead shows the text on solid blue with the photo as a
          band BELOW (see the mobile band further down). */}
      <div
        ref={buildingRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage: "url('/assets/live/hero-bg.webp')",
          backgroundSize: "100% auto",
          backgroundPosition: "50% 0%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, #689ECF 0%, rgba(104,158,207,0.82) 40%, rgba(104,158,207,0) 82%)",
        }}
      />

      {/* MOBILE/TABLET hero (Figma mobile, measured): a COMPACT text block on
          solid brand-blue — headline, a deliberate mobile excerpt, and the CTA —
          followed by a SEPARATE full-width building image band directly below.
          No image is positioned behind the text. On desktop (≥lg) the background
          treatment above is used with the full copy. Figma gaps: headline→body 18,
          body→CTA 18. */}
      <Container className="relative pt-[calc(var(--header-h)+40px)] pb-[36px] sm:pt-[calc(var(--header-h)+42px)] lg:pb-[44px]">
        {/* contentRef fades/drifts on scroll (desktop only). */}
        <div ref={contentRef} className="will-change-[opacity,transform]">
          <h1 className="max-w-[840px] text-[29px] leading-[36px] font-semibold tracking-[-0.2px] text-white sm:text-[38px] sm:leading-[48px] lg:text-[50px] lg:leading-[70px]">
            {hero.headingLines.map((line, i) => (
              <span key={line}>
                {line}
                {/* Force the exact live break on desktop; wrap naturally below. */}
                {i < hero.headingLines.length - 1 && <br className="hidden lg:inline" />}
                {i < hero.headingLines.length - 1 && <span className="lg:hidden"> </span>}
              </span>
            ))}
          </h1>

          {/* Full copy on every breakpoint (mobile uses the smaller mobile type). */}
          <div className="mt-[18px] max-w-[580px] space-y-[16px] text-[18px] leading-[25px] text-white lg:mt-[32px] lg:space-y-[26px] lg:text-[20px] lg:leading-[26px]">
            {hero.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <PillButton href={hero.cta.href} className="mt-[18px] lg:mt-[32px]">
            {hero.cta.label}
          </PillButton>
        </div>
      </Container>

      {/* MOBILE/TABLET image band (measured ~212px in the 402 frame): the building
          photo as a SEPARATE full-width band directly below the text — never behind
          the words. Its bottom fades into the info band's navy so the photo blends
          smoothly into the band below. Hidden on desktop. */}
      {/* Placement measured from the OLD site's mobile hero: the building image
          (image-6.png, ~402×408, saved as hero-mobile.png) sits full-width at the
          bottom — background-size 100% 400px, position 50% 100%, no-repeat. Its
          near-square ratio means it fills the 400px band with no distortion, so
          the full building shows correctly over the blue background. */}
      {/* Pulled UP into the text area so the building's corner rises to about the
          CTA level (per the target). Safe because the image's upper area is fully
          transparent (the button/blue show through) and the band is
          pointer-events-none (the button stays clickable). */}
      <div aria-hidden="true" className="pointer-events-none relative -mt-[170px] h-[400px] w-full overflow-hidden lg:hidden">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/live/hero-mobile.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "50% 100%",
          }}
        />
        {/* Subtle bottom fade only (not a corner) into the info band's navy. */}
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-gradient-to-b from-transparent to-[#3f5f7b]" />
      </div>

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
      {/* Mobile: a clean SOLID navy (blends with the building band's bottom fade
          above); desktop keeps the frosted-building + navy-tint depth treatment. */}
      <div className="relative w-full overflow-hidden bg-[#3f5f7b] lg:bg-transparent">
        {/* Frosted building behind the tint (blur ≈ 66.67 × render/1920) — desktop. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden scale-110 bg-[url('/assets/live/hero-bg.webp')] bg-[length:100%_auto] bg-[position:50%_100%] bg-no-repeat blur-[50px] lg:block"
        />
        {/* Navy tint #0E384F @ 0.5 over the frosted building — desktop. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-rebm-band-info lg:block" />

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
            className="text-[18px] leading-[23.4px] text-white lg:min-w-0 lg:basis-0 lg:grow-[44]"
            stagger={0.12}
            start="top 88%"
          >
            {/* Bulleted on mobile (matches the reference); on desktop the bullets
                are removed so it reads as the approved two-column band. */}
            <ul className="flex list-disc flex-col gap-[8px] pl-[22px] marker:text-white lg:list-none lg:gap-[4px] lg:pl-0">
              {hero.band.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}

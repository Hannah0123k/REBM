import { Container } from "@/components/Container";
import { PillButton } from "@/components/PillButton";
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
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-rebm-blue">
      {/* Photo as a background layer — exactly the live treatment:
          size 100% (width 100%, height auto) · position top-centre · no-repeat.
          Set inline for reliability (the Tailwind arbitrary bg-size didn't apply). */}
      <div
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
      </Container>

      {/* Info band — EXACT Figma design (Rectangle 5, 95:36): a full-width
          translucent navy strip #0E384F @ 0.5 over the hero photo, 226 tall with
          67px top/bottom padding. Left copy column 782 wide, a white vertical
          divider 98 tall, then the right column 617 wide. All text Helvetica-
          equivalent 18/23.4 white. Content is the live wording (source of truth);
          geometry/typography are Figma. Stacks on mobile. */}
      <div className="relative w-full bg-rebm-band-info">
        <Container className="flex flex-col gap-[28px] py-[48px] lg:flex-row lg:gap-0 lg:py-[67px]">
          <p className="text-[18px] leading-[23.4px] text-white lg:w-[782px] lg:shrink-0">
            {hero.band.summary}
          </p>
          <div aria-hidden="true" className="hidden self-stretch lg:mx-[52px] lg:block lg:w-px lg:bg-white" />
          <div className="flex flex-col gap-[4px] text-[18px] leading-[23.4px] text-white lg:w-[617px]">
            {hero.band.points.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}

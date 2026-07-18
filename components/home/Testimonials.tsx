import { Container } from "@/components/Container";
import { PillButton } from "@/components/PillButton";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/home/Faq";
import { testimonials } from "@/content/homepage";

/**
 * Testimonials + FAQ + closing CTA — one blue section. Live section 8
 * (y 6206 → 9017). The FAQ lives inside this same blue band, so it is rendered
 * here after the testimonial grid.
 *
 * Live spec:
 *   bg       solid #689ECF, content padding 96px top / 125px bottom
 *   heading  Inter 62/80.6 w700 #032C40
 *   grid     8 white cards, 3-column MASONRY, 20px gap, staggered tops
 *   card     width ~498, bg #fff, radius 20px, padding 64px 62px 64px 64px
 *            stars (120×24) → body (Inter 23/29.9 #000) → author near bottom
 *   author   live computes to Helvetica Neue 18/23.4 w700 — the only non-Inter
 *            text on the page. Rendered in Inter 700 per the spec's recommendation
 *            (Elementor default leaking through, not a design intent).
 *
 * Masonry is done with CSS `columns` — no JS, and no unpinned unpkg Masonry
 * script (CLAUDE.md pre-launch flag). DOM order is preserved; columns only
 * affect visual packing.
 */
export function Testimonials() {
  return (
    <section id="testimonials" className="w-full bg-rebm-blue">
      <Container className="pt-[96px] pb-[125px]">
        <Reveal>
          <h2 className="text-[36px] leading-[44px] font-bold text-rebm-navy lg:text-[62px] lg:leading-[80.6px]">
            {testimonials.heading}
          </h2>
        </Reveal>

        {/* Aligned grid (was a CSS-column masonry) so every card in a row shares
            the same top line — the masonry let a column's first card drift
            slightly lower depending on the browser's balancing. items-start keeps
            each card its natural height, so shorter cards don't stretch. */}
        <Reveal
          className="mt-[32px] grid grid-cols-1 items-start gap-[20px] sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.05}
          start="top 82%"
        >
          {testimonials.items.map((t) => (
            <figure
              key={t.author}
              className="rounded-[20px] bg-white p-[32px] sm:p-[48px] lg:p-[64px] lg:pr-[62px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/live/stars.svg" alt="5 out of 5 stars" width={120} height={24} />
              <blockquote className="mt-[50px] text-[23px] leading-[29.9px] text-black">
                {t.body}
              </blockquote>
              <figcaption className="mt-[24px] text-[18px] leading-[23.4px] font-bold text-black">
                {t.author}
              </figcaption>
            </figure>
          ))}
        </Reveal>

        <Faq />

        <Reveal className="mt-[48px] flex justify-center">
          <PillButton href={testimonials.cta.href}>{testimonials.cta.label}</PillButton>
        </Reveal>
      </Container>
    </section>
  );
}

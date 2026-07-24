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
 *            body (Inter 23/29.9 #000) → author near bottom (star rating removed)
 *   author   live computes to Helvetica Neue 18/23.4 w700 — the only non-Inter
 *            text on the page. Rendered in Inter 700 per the spec's recommendation
 *            (Elementor default leaking through, not a design intent).
 *
 * Masonry is done with CSS `columns` — no JS, and no unpinned unpkg Masonry
 * script (CLAUDE.md pre-launch flag). DOM order is preserved; columns only
 * affect visual packing.
 */
/**
 * Split testimonials into `n` columns for the masonry. Each item goes to the
 * currently-shortest column (greedy by cumulative body length ≈ height), which
 * keeps the columns roughly balanced while every column starts a card at the
 * top — so the first row of cards shares one top line. Deterministic (order-in,
 * order-scanned), so it renders identically on server and client.
 */
function toColumns<T extends { body: string }>(items: readonly T[], n: number): T[][] {
  const cols: T[][] = Array.from({ length: n }, () => []);
  const heights = new Array<number>(n).fill(0);
  for (const item of items) {
    let k = 0;
    for (let i = 1; i < n; i++) if (heights[i] < heights[k]) k = i;
    cols[k].push(item);
    heights[k] += item.body.length;
  }
  return cols;
}

export function Testimonials() {
  return (
    <section id="testimonials" className="w-full bg-rebm-blue">
      <Container className="pt-[56px] pb-[56px] lg:pt-[96px] lg:pb-[125px]">
        <Reveal>
          <h2 className="text-[29px] leading-[36px] font-bold text-rebm-navy lg:text-[62px] lg:leading-[80.6px]">
            {testimonials.heading}
          </h2>
        </Reveal>

        {/* Masonry, but with the columns packed explicitly instead of via CSS
            `columns`. Each column stacks its cards from the top, so every
            column's FIRST card shares the same top line (CSS `columns` let a
            column's first card drift lower in some browsers), and leftover space
            still falls at the BOTTOM of the shorter columns (Hannah's preference
            over an aligned grid). Cards are distributed greedily by length so the
            columns stay roughly balanced. No JS runtime / no Masonry script. */}
        <Reveal
          className="mt-[32px] flex flex-col gap-[20px] lg:flex-row lg:items-start"
          stagger={0.08}
          start="top 82%"
        >
          {toColumns(testimonials.items, 3).map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-[20px]">
              {col.map((t) => (
                <figure
                  key={t.author}
                  className="rounded-[20px] bg-white p-[32px] shadow-[0_16px_40px_-20px_rgba(3,44,64,0.30)] sm:p-[48px] lg:p-[64px] lg:pr-[62px]"
                >
                  {/* Star rating removed (Hannah). The quote now starts at the
                      card padding — no empty reserved space above it. */}
                  <blockquote className="text-[16px] leading-[25px] text-black sm:text-[18px] sm:leading-[27px] lg:text-[23px] lg:leading-[29.9px]">
                    {t.body}
                  </blockquote>
                  <figcaption className="mt-[24px] text-[18px] leading-[23.4px] font-bold text-black">
                    {t.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </Reveal>

        <Faq />

        {/* Closing CTA sits a comfortable step below the FAQ — pulled up closer
            to the questions than the full section rhythm so it reads as the FAQ's
            own call-to-action, not a detached block. */}
        <Reveal className="mt-[16px] flex justify-center lg:mt-[24px]">
          <PillButton href={testimonials.cta.href}>{testimonials.cta.label}</PillButton>
        </Reveal>
      </Container>
    </section>
  );
}

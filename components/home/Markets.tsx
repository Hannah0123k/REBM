import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { markets } from "@/content/homepage";

/**
 * "Markets We Serve" — 2×3 card grid, 6 cards. Live section 6 (y 4116 → 5797).
 *
 * Live spec:
 *   bg        #F5F5F5
 *   heading   Inter 62/80.6 w700 #032C40, ~96px above the grid
 *   grid      2 columns, 20px gap both directions
 *   card      760×421, fill #F9F9F9, 1px solid #D9D9D9, radius 30px,
 *             padding 15px 15px 32px 15px
 *   images    two side by side, gap 22px, ~354×257 each, corners baked into PNG
 *   title     Inter 32/41.6 w700 #032C40
 *   subtitle  Inter 24/31.2 w400 #05212F, 10px below the title
 *
 * Cards are equal-height (items-stretch) so a longer subtitle grows the whole
 * row evenly — the spacing rule. Card width is fluid; the grid caps at 2 cols.
 */
export function Markets() {
  return (
    <section id="property" className="w-full bg-[#F5F5F5]">
      <Container className="pt-[96px] pb-[96px]">
        <Reveal>
          <h2 className="text-[36px] leading-[44px] font-bold text-rebm-navy lg:text-[62px] lg:leading-[80.6px]">
            {markets.heading}
          </h2>
        </Reveal>

        {/* Cards fade up in a quick stagger. */}
        <Reveal
          className="mt-[42px] grid grid-cols-1 gap-[20px] lg:grid-cols-2"
          stagger={0.07}
          start="top 80%"
        >
          {markets.cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col rounded-[30px] border border-rebm-card-border bg-rebm-card p-[15px] pb-[32px]"
            >
              <div className="flex gap-[22px]">
                {card.images.map((img) => (
                  // Decorative, pre-rounded PNGs — plain <img> so they always
                  // render (Next Image lazy-loads these below the fold, and they
                  // need no optimization at 354×257).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img}
                    src={`/assets/live/${img}.png`}
                    alt=""
                    width={354}
                    height={257}
                    className="aspect-[354/257] min-w-0 flex-1 object-fill"
                  />
                ))}
              </div>
              <h3 className="mt-[24px] text-[32px] leading-[41.6px] font-bold text-rebm-navy">
                {card.title}
              </h3>
              <p className="mt-[10px] text-[24px] leading-[31.2px] text-rebm-footer">
                {card.subtitle}
              </p>
            </article>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

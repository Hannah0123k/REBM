import { Container } from "@/components/Container";
import { valueProps } from "@/content/homepage";

/**
 * "Why Real Estate Broker Match / Choosing The Right Expert / This Is Important
 * To Us" — 3-column feature band. Live section 5 (y 3394 → 4116).
 *
 * Live spec:
 *   bg      solid #689ECF, content padding 123px top / 176px bottom
 *   title   Inter 30/39 w700 #032C40, margin-bottom 25px
 *   body    Inter 23/29.9 w400 #fff
 *
 * Two request-driven refinements:
 *   1. "Why Real Estate Broker Match" must stay on ONE line at desktop — the
 *      title is nowrap at lg and its size eases to 28px so it fits the column.
 *   2. Body paragraphs align across columns: a 3×2 grid puts all titles in row 1
 *      (shared height) and all bodies in row 2, so every paragraph starts at the
 *      same vertical position regardless of title length.
 */
export function ValueProps() {
  return (
    <section className="w-full bg-rebm-blue">
      <Container className="grid grid-cols-1 gap-x-[64px] gap-y-[40px] pt-[123px] pb-[176px] lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
        {valueProps.map((col) => (
          <h3
            key={col.title}
            className="text-[26px] leading-[34px] font-bold text-rebm-navy lg:row-start-1 lg:mb-[25px] lg:text-[28px] lg:leading-[36px] lg:whitespace-nowrap"
          >
            {col.title}
          </h3>
        ))}
        {valueProps.map((col) => (
          <p
            key={col.title}
            className="text-[23px] leading-[29.9px] text-white lg:row-start-2"
          >
            {col.body}
          </p>
        ))}
      </Container>
    </section>
  );
}

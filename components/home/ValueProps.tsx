import { Container } from "@/components/Container";
import { valueProps } from "@/content/homepage";

/**
 * "Why Real Estate Broker Match / Choosing The Right Expert / This Is Important
 * To Us" — 3-column feature band. Live section 5 (y 3394 → 4116).
 *
 * Live spec:
 *   bg      solid #689ECF
 *   content padding 123px top / 176px bottom
 *   3 columns, space-between, top-aligned, unequal auto widths (508 / 539 / 385)
 *   title   Inter 30/39 w700 #032C40, margin-bottom 25px
 *   body    Inter 23/29.9 w400 #fff
 *
 * Per the spacing rule, columns are equal-width flexible cells here rather than
 * the live site's content-driven auto widths — keeps the row balanced when copy
 * lengths differ, which is the intended "designed around the content" feel.
 */
export function ValueProps() {
  return (
    <section className="w-full bg-rebm-blue">
      <Container className="flex flex-col gap-[48px] pt-[123px] pb-[176px] lg:flex-row lg:gap-[64px]">
        {valueProps.map((col) => (
          <div key={col.title} className="flex-1">
            <h3 className="mb-[25px] text-[30px] leading-[39px] font-bold text-rebm-navy">
              {col.title}
            </h3>
            <p className="text-[23px] leading-[29.9px] text-white">{col.body}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}

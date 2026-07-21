import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { ValuePropCards } from "@/components/home/ValuePropCards";
import { valueProps } from "@/content/homepage";

/**
 * "Why We Do What We Do" — value-prop section (live section 5).
 *
 * A centered navy heading + intro over the brand-blue band, then three white
 * elevated cards with a deep-navy icon badge (white icon) straddling each card's
 * top edge, a navy title, a short accent rule, and the body copy. No decorative
 * artwork behind the cards. Moving the body onto white cards also fixes the
 * earlier white-on-#689ECF contrast failure — card copy is dark navy on white.
 *
 * Copy is unchanged (source-of-truth live wording). The cards animate in with a
 * staggered drop-in — see ValuePropCards.
 */
export function ValueProps() {
  return (
    <section className="w-full bg-gradient-to-b from-[#74A6D5] via-rebm-blue to-[#5C92CB]">
      <Container className="pt-[56px] pb-[56px] lg:pt-[72px] lg:pb-[100px]">
        {/* Header — the heading leads the section; top padding is trimmed so it
            starts efficiently without a large blank band above it. */}
        <Reveal className="mx-auto max-w-[820px] text-center" y={20} stagger={0.08}>
          <h2 className="text-[29px] leading-[36px] font-bold tracking-[-0.5px] text-rebm-navy sm:text-[52px] sm:leading-[60px]">
            {valueProps.heading}
          </h2>
          <p className="mx-auto mt-[22px] max-w-[720px] text-[18px] leading-[25px] text-white sm:text-[20px] sm:leading-[30px]">
            {valueProps.intro.lead}
            <br />
            <span className="italic text-white/90">{valueProps.intro.emphasis}</span>
          </p>
        </Reveal>

        <ValuePropCards cards={valueProps.cards} />
      </Container>
    </section>
  );
}

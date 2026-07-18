import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { VALUE_PROP_ICONS } from "@/components/icons/ValuePropIcons";
import { valueProps } from "@/content/homepage";

/**
 * "Why We Do What We Do" — value-prop section (live section 5).
 *
 * Redesigned per Hannah (2026-07-17): a centered header (kicker + navy heading +
 * intro) over the brand-blue band, then three white cards with a navy icon badge
 * straddling each card's top edge, a navy title, a short accent rule, and the
 * body copy. Moving the body onto white cards also fixes the earlier white-on-
 * #689ECF contrast failure — card copy is now dark navy on white.
 *
 * Copy is unchanged (source-of-truth live wording); only the layout is new.
 */
export function ValueProps() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#74A6D5] via-rebm-blue to-[#5C92CB]">
      {/* Subtle dotted corners, echoing the reference. Purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[240px] w-[240px] opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1.3px, transparent 1.6px)",
          backgroundSize: "16px 16px",
          maskImage: "radial-gradient(circle at bottom left, #000, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at bottom left, #000, transparent 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-[240px] w-[240px] opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1.3px, transparent 1.6px)",
          backgroundSize: "16px 16px",
          maskImage: "radial-gradient(circle at bottom right, #000, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at bottom right, #000, transparent 72%)",
        }}
      />

      <Container className="relative py-[96px]">
        {/* Header */}
        <Reveal className="mx-auto max-w-[820px] text-center" y={20} stagger={0.08}>
          <p className="text-[14px] font-semibold tracking-[0.18em] text-white/90 uppercase">
            {valueProps.kicker}
          </p>
          <span className="mx-auto mt-[14px] block h-[3px] w-[54px] rounded-full bg-white/70" />
          <h2 className="mt-[20px] text-[38px] leading-[46px] font-bold tracking-[-0.5px] text-rebm-navy sm:text-[52px] sm:leading-[60px]">
            {valueProps.heading}
          </h2>
          <p className="mx-auto mt-[22px] max-w-[720px] text-[19px] leading-[29px] text-white sm:text-[20px] sm:leading-[30px]">
            {valueProps.intro.lead}
            <br />
            <span className="italic text-white/90">{valueProps.intro.emphasis}</span>
          </p>
        </Reveal>

        {/* Cards */}
        <Reveal
          className="mt-[72px] grid grid-cols-1 items-stretch gap-[32px] md:grid-cols-3 md:gap-[28px] lg:gap-[36px]"
          y={24}
          stagger={0.12}
          start="top 85%"
        >
          {valueProps.cards.map((card) => {
            const Icon = VALUE_PROP_ICONS[card.icon];
            return (
              <div
                key={card.title}
                className="relative flex flex-col items-center rounded-[22px] bg-white px-[32px] pt-[62px] pb-[44px] text-center shadow-[0_22px_48px_rgba(3,44,64,0.14)]"
              >
                {/* Navy icon badge straddling the card's top edge. */}
                <div className="absolute -top-[38px] flex size-[76px] items-center justify-center rounded-full bg-rebm-navy text-white shadow-[0_10px_22px_rgba(3,44,64,0.28)]">
                  <Icon className="size-[34px]" aria-hidden="true" />
                </div>

                <h3 className="text-[24px] leading-[30px] font-bold text-balance text-rebm-navy">
                  {card.title}
                </h3>
                <span className="mt-[16px] block h-[3px] w-[46px] rounded-full bg-rebm-blue" />
                <p className="mt-[22px] text-[16px] leading-[26px] text-[rgb(51,63,74)]">
                  {card.body}
                </p>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}

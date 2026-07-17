import { Container } from "@/components/Container";
import { PillButton } from "@/components/PillButton";
import { luckCta } from "@/content/homepage";

/**
 * "Finding the right broker on Google is luck…" CTA band. Live section 4
 * (y 2927 → 3394, height 467).
 *
 * Live spec:
 *   bg      Group-51.png — reads as flat #689ECF; solid colour is identical
 *   content padding 100/90, narrow centred column (~998), everything centred
 *   H2      Inter 29/37.7 w700 #fff, ls -0.2px, CENTER
 *   body    Inter 23/29.9 w400 #fff, CENTER
 *   button  primary pill → /contact-us/
 *
 * Heading is centred (was drifting) and wide enough (760) to keep the "…is
 * strategy." clause on the same line as the sentence before it at desktop.
 * Vertical padding trimmed a touch so the band is shorter but not cramped.
 */
export function LuckCta() {
  return (
    <section className="w-full bg-rebm-band-cta">
      <Container className="flex flex-col items-center py-[76px] text-center">
        <h2 className="max-w-[760px] text-[29px] leading-[37.7px] font-bold tracking-[-0.2px] text-white">
          {luckCta.heading}
        </h2>

        <p className="mt-[24px] max-w-[998px] text-[23px] leading-[29.9px] text-white">
          {luckCta.body}
        </p>

        <PillButton href={luckCta.cta.href} className="mt-[24px]">
          {luckCta.cta.label}
        </PillButton>
      </Container>
    </section>
  );
}

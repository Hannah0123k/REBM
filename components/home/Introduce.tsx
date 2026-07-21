import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { introduce } from "@/content/homepage";

/**
 * "Real Estate Broker Match Can Also Introduce You To:" — blue photo band with
 * three divided columns. Live section 7 (y 5797 → 6206).
 *
 * Live spec:
 *   bg       Group-51.png (reads as flat #689ECF with faint building) — flat
 *            blue is visually identical, so we use the solid colour, no asset.
 *   content  padding 100px top / 90px bottom, centred
 *   H2       Inter 30/39 w700 #fff, text-transform capitalize (stored Title Case)
 *   columns  3 equal cells, each centred <p> Inter 30/39 w400 #fff
 *   dividers cols 1 & 2 have border-right 1px solid #fff
 */
export function Introduce() {
  return (
    <section className="w-full bg-rebm-band-can">
      <Container className="pt-[56px] pb-[56px] lg:pt-[100px] lg:pb-[90px]">
        <Reveal className="flex flex-col items-center text-center" stagger={0.1}>
          <h2 className="text-[29px] leading-[36px] font-bold text-white lg:text-[30px] lg:leading-[39px]">
            {introduce.heading}
          </h2>

          {/* Mobile: stacked with thin horizontal dividers between items (smaller
              text). Desktop: three columns with vertical dividers (unchanged). */}
          <div className="mt-[32px] flex w-full flex-col lg:mt-[63px] lg:flex-row lg:gap-0">
            {introduce.items.map((item, i) => (
              <p
                key={item}
                className={`flex-1 px-[24px] py-[24px] text-[18px] leading-[25px] text-white lg:py-0 lg:text-[30px] lg:leading-[39px] ${
                  i > 0 ? "border-t border-white/40 lg:border-t-0" : ""
                } ${i < introduce.items.length - 1 ? "lg:border-r lg:border-white" : ""}`}
              >
                {item}
              </p>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

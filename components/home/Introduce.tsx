import { Container } from "@/components/Container";
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
      <Container className="flex flex-col items-center pt-[100px] pb-[90px] text-center">
        <h2 className="text-[30px] leading-[39px] font-bold text-white">
          {introduce.heading}
        </h2>

        <div className="mt-[63px] flex w-full flex-col gap-[32px] lg:flex-row lg:gap-0">
          {introduce.items.map((item, i) => (
            <p
              key={item}
              className={`flex-1 px-[24px] text-[30px] leading-[39px] text-white ${
                i < introduce.items.length - 1 ? "lg:border-r lg:border-white" : ""
              }`}
            >
              {item}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}

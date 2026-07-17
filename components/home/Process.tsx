import { Container } from "@/components/Container";
import { process } from "@/content/homepage";

/**
 * "Real Estate Broker Match makes finding the right real estate broker simple."
 * Live section 3 (y 2080 → 2927, height 846).
 *
 * Image placement matches the live site exactly (and Figma): the building photo
 * is the live asset Group-50-1.png (process-bg.webp, 1931×846) used as a
 * full-bleed SECTION BACKGROUND —
 *   background-size: cover · background-position: 100% 50% · no-repeat
 * The building sits on the left and fades to white on the right (the fade is
 * baked into the PNG), and the text column sits on the clean white right side.
 * No CSS gradient — the asset carries it, like the live site.
 *
 * The background shows from lg up (the live desktop layout); on mobile the
 * section is plain white so the single-column text stays readable.
 *
 * Text (live): H2 Inter 32/41.6 w700 #032C40 · intro 24/31.2 · Step labels
 * 24/31.2 w700 #689ECF · step body 18/23.4 w500. Container justify-end → text
 * pinned right, 605 wide.
 */
export function Process() {
  return (
    <section
      id="process"
      className="relative w-full overflow-hidden bg-white bg-cover bg-[position:100%_50%] bg-no-repeat lg:bg-[url('/assets/live/process-bg.webp')]"
    >
      {/* Group 34: x=1125, y=1121.5 → 109 below the section top. */}
      <Container className="relative flex min-h-[846px] justify-end pt-[109px]">
        <div className="w-full lg:w-[605px] lg:shrink-0">
        <h2 className="text-[32px] leading-[41.6px] font-bold text-black">
          {process.heading}
        </h2>

        <p className="mt-[24px] text-[24px] leading-[31.2px] text-black">
          {process.intro}
        </p>

        <div className="mt-[39px] space-y-[24px]">
          {process.steps.map((step) => (
            <div key={step.label}>
              <h4 className="text-[24px] leading-[31.2px] font-bold text-rebm-blue">
                {step.label}
              </h4>
              <p className="mt-[8px] text-[18px] leading-[23.4px] font-medium text-black">
                {step.before}
                {step.linkText && (
                  <a
                    href={step.linkHref}
                    className="text-rebm-link underline transition-opacity hover:opacity-70"
                  >
                    {step.linkText}
                  </a>
                )}
                {step.after}
              </p>
            </div>
          ))}
        </div>
        </div>
      </Container>
    </section>
  );
}

import Image, { type StaticImageData } from "next/image";

import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { bios } from "@/content/homepage";
import alanPhoto from "@/public/assets/live/alan.webp";
import rhettPhoto from "@/public/assets/live/rhett.webp";

/**
 * Bios — "Alan Fruitman / Rhett Fruitman". Live section 2 (y 982 → 2080),
 * directly after the hero.
 *
 * Live spec:
 *   bg        #F5F5F5, content padding 202px top / 50px bottom
 *   row       image-box: photo left (margin-right 65px), name+body right
 *   photo     285.7×248, border-radius 30px, object-cover, from the live PNGs
 *             (alan.png / rhett2.png — transparent cutouts)
 *   name      Inter 62/80.6 w900 #032C40, margin-bottom 20px
 *   body      Inter 23/29.9 w400 #000
 *   row 2     margin-top 51px
 *   closing   Inter 24/39.6 w400 rgb(30,41,59) with an inline link
 *
 * Images are the LIVE assets, not the earlier Figma node-renders. Copy is the
 * full live bios (longer than Figma's); the section grows to fit per the
 * spacing rule.
 */
const PHOTOS: Record<string, StaticImageData> = { alan: alanPhoto, rhett: rhettPhoto };

// The two cutouts carry different amounts of transparent headroom above the
// head (Alan's head starts ~2% down the file, Rhett's ~7%). With object-cover
// that pushed Rhett's head ~20px lower in the box than Alan's, so his head sat
// well below his name. A per-photo object-position crops that extra headroom so
// each head aligns to the top of its box (and therefore its name).
const HEAD_POSITION: Record<string, string> = {
  alan: "50% 0%",
  rhett: "50% 16%",
};

export function Bios() {
  return (
    <section id="about" className="w-full bg-[#F5F5F5]">
      <Container className="pt-[56px] pb-[56px] lg:pt-[101px] lg:pb-[50px]">
        {/* Kicker, then each profile row as a unit (Alan first, Rhett ~0.15s
            later), then the closing line — all fade up in sequence. */}
        {/* Kicker and EACH profile row get their OWN scroll-entrance, so Alan and
            Rhett both fade up as they scroll into view. (One shared Reveal fired
            when the section top entered, animating Rhett while still off-screen.) */}
        <Reveal>
          <h2 className="mb-[16px] text-center text-[29px] leading-[36px] font-bold text-rebm-navy sm:pl-[350.7px] sm:text-left lg:text-[34px] lg:leading-[42px]">
            Meet Alan &amp; Rhett
          </h2>
        </Reveal>
        {bios.people.map((person, i) => (
          <Reveal key={person.name} className={i > 0 ? "mt-[51px]" : ""}>
            {/* The photo wrapper tracks the text column's height on desktop
                (capped at 248px); on mobile it collapses to the fixed 248. */}
            <div className="flex flex-col items-center gap-[24px] sm:flex-row sm:items-stretch sm:gap-0">
              <div className="w-[285.7px] shrink-0 sm:relative sm:mr-[65px] sm:max-h-[248px] sm:self-stretch">
                <Image
                  src={PHOTOS[person.photo]}
                  alt={person.alt}
                  style={{ objectPosition: HEAD_POSITION[person.photo] ?? "50% 0%" }}
                  className="h-[248px] w-full rounded-[30px] object-cover sm:absolute sm:inset-0 sm:h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-[20px] text-center text-[40px] leading-[40px] font-black text-rebm-navy sm:text-left lg:text-[62px] lg:leading-[62px]">
                  {person.name}
                </h3>
                {/* A bio paragraph is either a plain string or a segmented
                    {before, linkText, linkHref, after} when it carries an inline
                    link (Alan's NNN book). Same shape and same anchor styling as
                    `bios.closing` below — one pattern for both. */}
                <div className="space-y-[20px] text-[16px] leading-[24px] text-black lg:text-[23px] lg:leading-[29.9px]">
                  {person.body.map((para) =>
                    typeof para === "string" ? (
                      <p key={para}>{para}</p>
                    ) : (
                      <p key={para.linkText}>
                        {para.before}
                        <a
                          href={para.linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rebm-link underline transition-opacity hover:opacity-70"
                        >
                          {para.linkText}
                        </a>
                        {para.after}
                      </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}

        <Reveal className="mt-[50px]">
          <p className="text-[18px] leading-[27px] text-[rgb(30,41,59)] lg:text-[24px] lg:leading-[39.6px]">
            {bios.closing.before}
            <a
              href={bios.closing.linkHref}
              target="_blank"
              rel="noreferrer noopener"
              className="text-rebm-link underline"
            >
              {bios.closing.linkText}
            </a>
            {bios.closing.after}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

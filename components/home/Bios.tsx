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
      <Container className="pt-[101px] pb-[50px]">
        {/* Kicker, then each profile row as a unit (Alan first, Rhett ~0.15s
            later), then the closing line — all fade up in sequence. */}
        <Reveal stagger={0.15}>
        {/* "Meet Alan & Rhett" kicker — indented to the text column so it sits
            above the name; the photo below aligns to the name's top, not the
            kicker (matches the reference). An addition; not on the live site. */}
        <h2 className="mb-[16px] text-[28px] leading-[34px] font-bold text-rebm-navy sm:pl-[350.7px] lg:text-[34px] lg:leading-[42px]">
          Meet Alan &amp; Rhett
        </h2>
        {bios.people.map((person, i) => (
          <div
            key={person.name}
            className={`flex flex-col items-start gap-[24px] sm:flex-row sm:items-stretch sm:gap-0 ${i > 0 ? "mt-[51px]" : ""}`}
          >
            {/* On desktop the photo tracks the text column's height, capped at
                its 248px design height. The wrapper is the flex item so
                align-items:stretch grows it to the row height (the text column),
                while the image fills it absolutely — a percentage height on the
                <img> itself would fall back to its intrinsic 248 and never
                shrink. So a SHORTER bio (Rhett) pulls the photo down to the
                text's height, bottom-aligned with the last line; a LONGER bio
                (Alan) hits the 248 cap and stays top-aligned as designed. On
                mobile the wrapper collapses and the image keeps its fixed 248. */}
            <div className="w-[285.7px] shrink-0 sm:relative sm:mr-[65px] sm:max-h-[248px] sm:self-stretch">
              <Image
                src={PHOTOS[person.photo]}
                alt={person.alt}
                style={{ objectPosition: HEAD_POSITION[person.photo] ?? "50% 0%" }}
                className="h-[248px] w-full rounded-[30px] object-cover sm:absolute sm:inset-0 sm:h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              {/* Line-height tightened to the font size so the name's cap sits
                  at the top of its box, aligning with the headshot top (the
                  extra leading otherwise dropped the cap ~9px below the photo). */}
              <h3 className="mb-[20px] text-[40px] leading-[40px] font-black text-rebm-navy lg:text-[62px] lg:leading-[62px]">
                {person.name}
              </h3>
              <div className="space-y-[20px] text-[23px] leading-[29.9px] text-black">
                {person.body.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        ))}

        <p className="mt-[50px] text-[24px] leading-[39.6px] text-[rgb(30,41,59)]">
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

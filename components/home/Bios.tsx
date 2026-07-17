import Image, { type StaticImageData } from "next/image";

import { Container } from "@/components/Container";
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

export function Bios() {
  return (
    <section id="about" className="w-full bg-[#F5F5F5]">
      <Container className="pt-[202px] pb-[50px]">
        {bios.people.map((person, i) => (
          <div
            key={person.name}
            className={`flex flex-col gap-[24px] sm:flex-row ${i > 0 ? "mt-[51px]" : ""}`}
          >
            <Image
              src={PHOTOS[person.photo]}
              alt={person.alt}
              className="h-[248px] w-[285.7px] shrink-0 rounded-[30px] object-cover object-top sm:mr-[65px]"
            />
            <div className="min-w-0 flex-1">
              {/* "Meet Alan & Rhett" kicker — small bold label above the first
                  name, in the text column (an addition; not on the live site). */}
              {i === 0 && (
                <h2 className="mb-[12px] text-[24px] leading-[30px] font-bold text-rebm-navy lg:text-[28px] lg:leading-[34px]">
                  Meet Alan &amp; Rhett
                </h2>
              )}
              <h3 className="mb-[20px] text-[40px] leading-[48px] font-black text-rebm-navy lg:text-[62px] lg:leading-[80.6px]">
                {person.name}
              </h3>
              <p className="text-[23px] leading-[29.9px] text-black">{person.body}</p>
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
      </Container>
    </section>
  );
}

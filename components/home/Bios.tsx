import Image, { type StaticImageData } from "next/image";
import { Fragment } from "react";

import { INHERITED_PROPERTY_MATCH, bios } from "@/content/homepage";
import alanPhoto from "@/public/assets/alan.webp";
import rhettPhoto from "@/public/assets/rhett.webp";

/**
 * "You will work with:" — Alan and Rhett bios.
 * Figma frame 95:2, y 2306.5 → 3341.5 (Rectangle 8, 1920×1035, #FFFFFF).
 *
 * Geometry, exact from Figma:
 *   kicker    95:45   x=596  y=2456.5  HND-Bd 32/41.6  #000000
 *   Alan
 *     photo   95:74   x=300  y=2530.5  241×315  scaleMode FILL
 *     name    95:76   x=596  y=2508.5  HND-Blk 62/80.6  #689ECF
 *     bio     95:77   x=596  y=2613.5  1104 wide  HN 24/31.2  #000000
 *   Rhett
 *     photo   95:499  x=300  y=2925.5  241×280  scaleMode STRETCH
 *     name    95:79   x=596  y=2943.5
 *     bio     95:80   x=596  y=3048.5  1104 wide
 *
 * Derived: section top → kicker = 150 · kicker → name = 52 · name → bio = 105.
 * The photo sits 22px below its name (2530.5 vs 2508.5), i.e. it aligns to the
 * bio rather than to the name — hence the photo column's offset.
 *
 * Both headshots are exported as NODE renders at 3x, not from their imageRefs.
 * The raw images are opaque RGB with their photographic backgrounds intact
 * (Alan's room, Rhett's wall); Figma masks them to cut-outs, and only the node
 * render carries that alpha. Downloading the imageRef put the backgrounds back
 * — the same trap as the logo. The renders are already exactly 241×315 and
 * 241×280 at 3x, so no object-fit is needed.
 *
 * ⚠️ Rhett's node uses scaleMode STRETCH: a 500×750 source forced into a 241×280
 * box, ~29% wider than life. Figma's renderer bakes that in, so it is faithful
 * by construction — but it is a defect in the design rather than an intent, and
 * worth raising with the designer. Alan's uses FILL and is undistorted.
 *
 * Live bios are much longer than Figma's and add material Figma never had, so
 * this section runs taller than 1035px. See content/homepage.ts.
 */

const PHOTOS: Record<string, { src: StaticImageData; className: string }> = {
  alan: { src: alanPhoto, className: "h-[315px] w-[241px]" },
  rhett: { src: rhettPhoto, className: "h-[280px] w-[241px]" },
};

/** The live site links "Inherited Property Match" out; Figma has no such link. */
function withOutboundLink(text: string) {
  const parts = text.split(INHERITED_PROPERTY_MATCH.text);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={INHERITED_PROPERTY_MATCH.href}
          target="_blank"
          rel="noreferrer noopener"
          className="underline transition-opacity hover:opacity-70"
        >
          {INHERITED_PROPERTY_MATCH.text}
        </a>
      )}
    </Fragment>
  ));
}

export function Bios() {
  return (
    <section id="about" className="w-full bg-white pt-[150px] pb-[136px]">
      <div className="pl-[596px]">
        <h2 className="font-display text-[32px] leading-[41.6px] font-bold text-black">
          {bios.kicker}
        </h2>
      </div>

      {bios.people.map((person, i) => {
        const photo = PHOTOS[person.photo];
        return (
          <div key={person.name} className={i === 0 ? "mt-[52px]" : "mt-[51px]"}>
            {/* name sits at x=596; photo column starts at x=300 */}
            <div className="pl-[596px]">
              <h3 className="font-display text-[62px] leading-[80.6px] font-black text-rebm-blue">
                {person.name}
              </h3>
            </div>

            <div className="mt-[24px] flex pl-[300px]">
              <Image
                src={photo.src}
                alt={person.name}
                className={`shrink-0 ${photo.className}`}
              />
              <div className="ml-[55px] w-[1104px] space-y-[31.2px] text-[24px] leading-[31.2px] text-black">
                {person.paragraphs.map((p) => (
                  <p key={p}>{withOutboundLink(p)}</p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Homepage copy — sourced from the LIVE SITE, which is the content source of
 * truth (CLAUDE.md). Figma's wording is stale and materially different; where
 * they disagree, the text here wins and the Figma layout flexes around it.
 *
 * Kept separate from components so copy edits never touch layout, and so the
 * eventual publishing portal has one obvious place to write to.
 *
 * Notable divergences from Figma, for reviewers comparing the two:
 *   hero heading  Figma: "...Will Match You With A Real Estate Broker" (title
 *                 case, 3 lines at 62px). Live adds "who will sell your
 *                 property." and is sentence case → wraps to 4 lines.
 *   hero para 2   Figma cites "40,000 brokers"; live cites "more than 30 years"
 *                 of relationships and drops the number entirely.
 *   bullet 3      Figma: "a small share of the fee...when the sale successfully
 *                 closes". Live: "a referral fee...upon successful transaction".
 */

export const hero = {
  heading:
    "Real Estate Broker Match will match you with a real estate broker who will sell your property.",
  paragraphs: [
    "Alan and Rhett Fruitman have helped thousands of clients buy and sell billions of dollars of real estate since 1993.",
    "Real Estate Broker Match (REBM) personally connects you with a hand-selected broker from our nationwide network – vetted through more than 30 years of relationships built on trust, integrity, and performance.",
  ],
  cta: { label: "Contact REBM", href: "/contact-us" },
} as const;

export const serviceOverview = {
  summary:
    "REBM will recommend a broker with the experience, market specialization, connections, and communication skills needed to sell your property. We never match based on Google searches or paid advertisements.",
  points: [
    "REBM will connect you with an expert real estate broker.",
    "This matched broker will list and sell your property.",
    "REBM will receive a referral fee from the broker upon successful transaction.",
  ],
} as const;

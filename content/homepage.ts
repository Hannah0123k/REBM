/**
 * Homepage copy — verbatim from the LIVE SITE (realestatebrokermatch.com), the
 * final source of truth for content, order, wording, links and images
 * (CLAUDE.md → 2026-07-17 correction). Figma governs visual style only.
 *
 * Section order matches the live DOM exactly:
 *   hero → bios → process → luckCta → valueProps → markets → introduce
 *   → testimonials → faq → footer
 *
 * U+200E left-to-right marks that the live copy uses as manual spacing have been
 * stripped (benign paste artifacts) and rendered as normal spaces.
 */

export const CONTACT_HREF = "/contact";

/* 1 ── Hero + bottom info band ------------------------------------------------ */
export const hero = {
  heading:
    "Real Estate Broker Match will match you with a real estate broker who will sell your property.",
  // Same words as `heading`; the desktop layout breaks exactly here (request).
  headingLines: [
    "Real Estate Broker Match will",
    "match you with a real estate broker",
    "who will sell your property.",
  ],
  paragraphs: [
    "Alan and Rhett Fruitman have helped thousands of clients buy and sell billions of dollars of real estate since 1993.",
    "Real Estate Broker Match (REBM) personally connects you with a hand-selected broker from our nationwide network – vetted through more than 30 years of relationships built on trust, integrity, and performance.",
  ],
  cta: { label: "Contact REBM", href: CONTACT_HREF },
  band: {
    summary:
      "REBM will recommend a broker with the experience, market specialization, connections, and communication skills needed to sell your property. We never match based on Google searches or paid advertisements.",
    points: [
      "REBM will connect you with an expert real estate broker.",
      "This matched broker will list and sell your property.",
      "REBM will receive a referral fee from the broker upon successful transaction.",
    ],
  },
} as const;

/* 2 ── Bios ------------------------------------------------------------------- */
export const bios = {
  people: [
    {
      name: "Alan Fruitman",
      photo: "alan",
      alt: "Team: Alan",
      body: [
        // Segmented rather than a plain string so the book title can be an inline
        // link mid-sentence, exactly like `closing` below. Copy is unchanged.
        {
          before:
            "Since 1993, Alan has helped thousands of clients buy, sell, and lease billions of dollars in real estate. He is a nationally recognized expert in investment real estate and 1031 exchanges, and the author of ",
          linkText: "The NNN Triple Net Property Book",
          linkHref: "https://1031tax.com/nnn-book/",
          after:
            ". Alan has matched clients with trusted real estate brokers nationwide, and his proven track record makes him uniquely qualified to assist with the sale of your investment property.",
        },
        "Alan has been the trusted real estate broker for everyone ranging from first-time investors to billion-dollar property owners, attorneys, accountants, financial advisors, institutional fund managers, and family offices. He understands that while every client is unique, their goals are strikingly similar: to be heard and understood, to receive clear guidance, and to sell their property for the highest price with the smoothest process. Above all, Alan believes in giving clients realistic advice - not inflated projections or promises that can’t be delivered.",
      ],
    },
    {
      name: "Rhett Fruitman",
      photo: "rhett",
      alt: "",
      body: [
        "Drawing on his experience at Citi, CBRE and 1031tax.com, Rhett applies investment-grade due diligence to ensure every broker introduction meets our exact standards. Rhett oversees our client and broker relationships with the kind of attention you'd expect from your family's trusted advisor - professional, thorough, and always looking out for your best interests.",
      ],
    },
  ],
  closing: {
    // "Inherited Property Match" is an inline link mid-sentence.
    before: "Alan and Rhett also founded ",
    linkText: "Inherited Property Match",
    linkHref: "https://inheritedpropertymatch.com/",
    after:
      ", a broker-matching platform built specifically for heirs, executors, and trustees selling inherited real estate.",
  },
} as const;

/* 3 ── Process --------------------------------------------------------------- */
export const process = {
  heading: "Real Estate Broker Match makes finding the right real estate broker simple.",
  intro:
    "Attorneys are experts in law. CPAs and accountants are experts in tax. Financial Advisors are experts in investments. Real Estate Broker Match is an expert in connecting property owners with expert real estate brokers.",
  steps: [
    {
      label: "Step 1",
      // "contact" is an inline link in the live copy.
      before: "Call or ",
      linkText: "contact",
      linkHref: CONTACT_HREF,
      after: " REBM to sell investment or personal property.",
    },
    { label: "Step 2", before: "REBM will learn about your goals, expectations and property.", linkText: "", linkHref: "", after: "" },
    {
      label: "Step 3",
      before:
        "REBM will match you with a real estate broker whose expertise, focus, and proven track record align perfectly with your goals and expectations.",
      linkText: "",
      linkHref: "",
      after: "",
    },
  ],
} as const;

/* 4 ── "Google is luck" CTA band --------------------------------------------- */
export const luckCta = {
  heading:
    "Finding the right broker on Google is luck. Finding the right broker through REBM is strategy.",
  // Break so the second sentence starts on its own line (request).
  headingLines: [
    "Finding the right broker on Google is luck.",
    "Finding the right broker through REBM is strategy.",
  ],
  body: "When you work with a REBM broker – someone who understands your property and goals, brings unmatched expertise, anticipates your needs, and makes the entire process easier – you’ll be glad you didn’t leave it to luck.",
  cta: { label: "Contact REBM", href: CONTACT_HREF },
} as const;

/* 5 ── Why / Choosing / Important (3-col cards) ------------------------------ */
export const valueProps = {
  heading: "Why We Do What We Do",
  intro: {
    lead: "Real Estate Broker Match was created with one goal in mind:",
    emphasis: "to connect you with the right broker.",
  },
  cards: [
    {
      icon: "home",
      title: "Why Real Estate Broker Match",
      body: "Alan and Rhett built Real Estate Broker Match because their clients asked for this nationwide service. Knowing the “right” broker is crucial to a successful sale. Too often, people make the mistake of conveniently choosing a friend, a neighbor, or whoever shows up in an advertisement or Google search.",
    },
    {
      icon: "expert",
      title: "Choosing The Right Expert",
      body: "Choosing the right broker is just as important as selecting your attorney, tax or financial advisor. In real estate, you’re either on the inside - working with professionals who truly excel - or on the outside, hoping you guessed right. REBM ensures you’re always on the inside. Whether you're protecting clients' interests as a financial advisor or attorney, or making the biggest financial decision of your life as a property owner, you no longer have to guess.",
    },
    {
      icon: "handshake",
      title: "This Is Important To Us",
      body: "Real Estate Broker Match is a service we are proud to share with our family, friends, clients, and professional networks. Every broker we recommend is personally vetted and held to the same high standards we would apply if selecting for our own family. We put our name and thirty-year track record on the line with every broker match we make.",
    },
  ],
} as const;

/* 6 ── Markets We Serve ------------------------------------------------------ */
export const markets = {
  heading: "Markets We Serve",
  cards: [
    { title: "Residential", subtitle: "Apartment Buildings, Houses, Townhomes, Condos, Mixed-Use", images: ["Rectangle-22", "Rectangle-23-3"] },
    { title: "Single Tenant", subtitle: "Triple Net and Ground Leases", images: ["Rectangle-22-1", "Rectangle-23-1"] },
    { title: "Retail", subtitle: "Shopping and Power Centers", images: ["Rectangle-22-2", "Rectangle-23-2"] },
    { title: "Industrial", subtitle: "Warehouse, Distribution, Manufacturing, Showroom, Flex", images: ["Rectangle-22-4", "Rectangle-23-4"] },
    { title: "Office", subtitle: "Business, Medical, Mixed Use", images: ["Rectangle-22-5", "Rectangle-23-5"] },
    { title: "Other", subtitle: "Hotel / Motel, Self-Storage, Mobile Home Parks, Senior Living", images: ["Rectangle-22-6", "Rectangle-23-6"] },
  ],
} as const;

/* 7 ── "REBM can also introduce you to" -------------------------------------- */
export const introduce = {
  heading: "Real Estate Broker Match Can Also Introduce You To:",
  items: [
    "Mortgage broker who can finance or refinance your property",
    "Qualified Intermediary who can facilitate your 1031 exchange",
    "Complex & Time-Sensitive Transactions",
  ],
} as const;

/* 8 ── Testimonials ---------------------------------------------------------- */
export const testimonials = {
  heading: "Testimonials",
  items: [
    { author: "Scott Lewis, PE & Oma Lewis, MPT", body: "We have known Alan for eight years when he was instrumental in the purchase of our first property while educating us in the process. We have since purchased additional properties with Alan’s incredible help and support. Alan is a man of his word and integrity and his clients best interests are his foremost concern. When it came time to sell one of our properties, he introduced us to a trusted colleague that helped us through the process effectively and professionally. Through his years of experience in the business, Alan has generated a vast network of connections across the country. We highly recommend Alan and Real Estate Broker Match for anyone ready to sell their property." },
    { author: "Karen Smilowitz, Esq.", body: "Alan Fruitman has been instrumental in the purchase and sale of several properties for me and my family. Alan deserves the highest regard for his guidance and patience. Recently, Alan introduced me to a real estate broker who sold one of my properties. The process was very smooth and successful. I encourage you to work with Alan and Real Estate Broker Match." },
    { author: "Louie Z. Kaufman", body: "Alan Fruitman helped me purchase two properties in 2016. I found Alan to have extensive experience and knowledge in this industry. To make a long story short, I stayed in communication with Alan over the past 8 years and when I decided to sell one of my properties, he referred me to a real estate broker who successfully sold the property. Real Estate Broker Match will be a valuable resource when you are looking for the most knowledgeable professional to sell your property." },
    { author: "Sandra D. Hanson", body: "I have known Alan Fruitman since 2018. Alan and Real Estate Broker Match introduced me to a real estate broker who I would not otherwise have known about to sell one of our properties. The broker did an excellent job representing me. The property sold quickly at a price that exceeded my expectations; and the broker was extremely diligent and responsive. I’m very grateful that Alan understood what was needed and knew the right person to accomplish it." },
    { author: "Jeff Tucker", body: "I have known Alan Fruitman with Real Estate Broker Match for more than 10 years as he has helped my family with several real estate transactions. Alan has introduced me to an excellent real estate broker in Chicago. Alan is highly knowledgeable, professional and is always willing to help." },
    { author: "Jeff Willett", body: "I have known Alan Fruitman since 2016. Alan and the real estate broker he recommended to sell my property are true professionals and easy to work with. I confidently suggest that you work with Alan Fruitman and Real Estate Broker Match when you are ready to sell your property." },
    { author: "Deborah Reitz", body: "I have known Alan Fruitman since 2016. He is an astute real estate advisor, knowledgeable in all markets, generous with his time and candid with his recommendations. Alan connected me to a great broker in Utah. You can rely on him to advise you of the best talent in any market." },
    { author: "Maria Galasso", body: "I have known Alan Fruitman since 2021. Alan introduced my family to a broker that helped sell our Arizona property. I highly recommend Real Estate Broker Match and the services they provide." },
  ],
  cta: { label: "Contact REBM", href: CONTACT_HREF },
} as const;

/* 8b ── FAQ (5 inline items; "Show More" opens the rest on the live site) ----- */
export const faq = {
  heading: "Frequently Asked Questions",
  items: [
    { q: "How much does your service cost?", a: "When a transaction closes, the broker we matched you with compensates us from a portion of their commission. You never pay anything to REBM." },
    { q: "Who founded Real Estate Broker Match and why?", a: "Real Estate Broker Match was founded by Alan and Rhett Fruitman. Alan, a seasoned real estate professional, spent decades helping clients sell properties and structure 1031 exchange investments. Over the years, he worked with thousands of top-performing brokers nationwide, learning what truly separates exceptional brokers from average ones. Together, Alan and Rhett created REBM to restore trust, expertise, and personal attention to the broker selection process – because the right broker closes deals faster, saves you time and stress, and delivers stronger financial results." },
    { q: "How long has Real Estate Broker Match been in business?", a: "Alan has been matching clients with trusted brokers since 1993 – more than 30 years of proven relationships, expertise, and results. REBM was formalized in 2025, built on three decades of trusted relationships with brokers." },
    { q: "What makes REBM different from other broker referral platforms?", a: "Unlike automated referral sites or lead-generation platforms, REBM is deeply personal. Every match is hand-selected by Alan or Rhett – not an algorithm – drawing on 30+ years of proven experience and longstanding relationships. We don’t sell leads or pursue volume; we focus on quality, personal attention, and successful outcomes." },
    { q: "Can I speak with Alan or Rhett directly before submitting my information?", a: "Absolutely. You’re always welcome to speak directly with Alan or Rhett. We are happy to answer questions, discuss your goals, and ensure you’re comfortable before moving forward." },
    { q: "How do you choose which broker to match me with? Who actually reviews my request?", a: "Every submission is personally reviewed by Alan or Rhett – never an algorithm, AI, or an automated system. We start by understanding your property, goals, and timeline, then identify brokers with demonstrated success in your specific asset type and market – often with brokers we have worked with before. Each match is personally handled to ensure the broker’s expertise, track record, and approach align with your needs." },
    { q: "How do I know your brokers are top-tier?", a: "We only work with brokers who have proven track records. Each broker in our network has been personally interviewed and vetted for both experience and specialization, often through years of direct collaboration with Alan. We stake our reputation on every match and only recommend brokers we would trust with our family and friends." },
    { q: "What types of properties does REBM specialize in?", a: "We specialize in matching you with an expert broker in your asset type. Whether it’s NNN retail, multifamily, industrial, office, or residential property, we connect you with proven brokers who know your property category inside and out." },
    { q: "Are your brokers local to my market?", a: "Not always, but typically yes. We work with top-performing local brokers in every major U.S. market. Occasionally, a niche specialist who’s the best fit for your property type may not be local. When that’s the case, we will explain why their expertise matters." },
    { q: "Do your brokers handle both sales and leasing?", a: "Yes. Our network includes specialists in both sales and leasing across every major property type – ensuring you are matched with the right expert for your specific transaction." },
    { q: "Do you work with 1031 exchange clients?", a: "Absolutely. We regularly work with clients completing 1031 exchanges. This has been Alan Fruitman’s core expertise for decades." },
    { q: "How does REBM fit into the bigger picture of estate planning and step-up in basis?", a: "While we are not tax advisors, our extensive work with investment properties and 1031 exchanges has given us deep insight into how real estate, taxes, and inheritance intersect. The real estate broker we match you with can collaborate closely with your CPA, attorney, or financial advisor to help shape a strategy aligned with your long-term financial and estate goals – ensuring your real estate investments support both your current objectives and your family’s future legacy." },
    { q: "Do your brokers have experience working with properties that have complex ownership structures?", a: "Absolutely. Our brokers regularly handle transactions involving complex ownership structures – LLC, S-Corp, C-Corp, Trust, Tenancy-in-Common (TIC), Delaware Statutory Trusts (DST), multi-partner, and other structures." },
    { q: "What if my property has complications?", a: "Complicated properties require brokers with specialized skillsets. We will connect you with professionals experienced in marketing and selling properties with deferred maintenance, environmental issues, difficult tenants, zoning complications, and other challenges." },
    { q: "How do you handle situations where a client needs to sell quickly due to financial distress or time constraints?", a: "Our clients sometimes need to sell their property fast. The real estate broker we match you with can guide you through a short sale, partnership disputes, estate settlements, or exchange deadlines. They will maximize value even under compressed timelines while maintaining discretion and professionalism throughout the process." },
    { q: "Do you work with international clients or properties outside the United States?", a: "REBM focuses exclusively on properties within the United States. However, we have helped many international clients purchase and sell property in the U.S." },
    { q: "How quickly will I receive my broker match?", a: "Typically within 1-3 business days. However, complex properties or specialized markets may take a bit longer. Every match is personally handled – not automated – as we prioritize precision and fit over speed. That said, we move efficiently." },
    { q: "Can you still help if I already have a broker but want to explore other options?", a: "Yes. Many clients come to us while already working with a broker but want to compare options before committing. We can confidentially review your situation and connect you with a top-performing broker who can replace the broker you previously selected." },
    { q: "What if I'm not ready to sell right now but want to explore my options?", a: "That’s perfectly fine. Even if you’re not ready to sell immediately, we are happy to start the conversation and help you prepare. We will stay in touch, keep you informed on market trends, and introduce you to the right broker when you are ready." },
    { q: "What happens after I choose a broker?", a: "Once you choose a broker, we remain available to ensure everything moves smoothly. You can reach out with questions at any point, and if the match isn’t the right fit, we will help you find a better one. We are available for you from introduction through closing." },
    { q: "What if I want to sell multiple properties in different markets?", a: "We regularly handle multiple-property sales. Whether you’re selling several properties in one region or across multiple markets, we will connect you with the right specialist in each location – ensuring each property receives the attention and expertise it deserves." },
    { q: "Is my information kept confidential?", a: "Yes. We never share your details with anyone except the broker we match you with. We never sell or distribute your data beyond the initial introduction. Confidentiality and trust are non-negotiable in everything we do." },
    { q: "What happens to my information if I decide not to move forward?", a: "Our information stays private and is never shared. We can delete it upon request, or retain your contact information in case you’d like to revisit the conversation in the future. The choice is yours." },
  ],
  // The live site shows the first 5 questions, then "Show More Frequently Asked
  // Questions" reveals the remaining 18 (all 23 questions + answers restored
  // verbatim from the live site's Show-More modal). We reveal them INLINE (no
  // modal, no navigation) per the approved interaction.
  initialCount: 5,
  showMore: "Show More Frequently Asked Questions",
  showFewer: "Show Fewer",
  cta: { label: "Contact REBM", href: CONTACT_HREF },
} as const;

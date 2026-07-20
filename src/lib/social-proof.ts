export type SocialProofMetric = {
  label: string;
  value: string;
  note: string;
};

export type TestimonialProof = {
  name: string;
  role: string;
  quote: string;
  result: string;
};

export type CaseStudyProof = {
  title: string;
  segment: string;
  before: string;
  after: string;
  cta: string;
  href: string;
};

export const socialProofMetrics: SocialProofMetric[] = [
  {
    label: "Proof categories",
    value: "4",
    note: "Product ads, localization, website hero rebuilds and UGC demos."
  },
  {
    label: "Delivery model",
    value: "AI + human QA",
    note: "Every public proof block points back to review, credit estimate and delivery."
  },
  {
    label: "Reuse path",
    value: "Template-ready",
    note: "Visitors can turn approved examples into similar-style production requests."
  }
];

export const testimonialProofs: TestimonialProof[] = [
  {
    name: "Ecommerce founder",
    role: "Product video request",
    quote: "I needed a clearer ad direction before buying production credits. The Crelavo flow made the hook, product proof and next video brief easier to understand.",
    result: "Ad score result moved into a production-ready campaign brief."
  },
  {
    name: "Marketplace seller",
    role: "Localization brief",
    quote: "The same product message did not work for every country. The localization path helped us prepare market-specific hooks and buyer trust notes before production.",
    result: "One global ad idea became a localized campaign direction."
  },
  {
    name: "Startup team",
    role: "Website + launch assets",
    quote: "We wanted one place to connect website copy, visuals and launch assets. The credit estimate and human QA framing made the scope easier to approve.",
    result: "Website hero and launch asset request mapped into a tracked package."
  }
];

export const caseStudyProofs: CaseStudyProof[] = [
  {
    title: "Weak product ad to stronger campaign brief",
    segment: "Ecommerce ad scoring",
    before: "A product hook, CTA and offer were unclear before spending budget.",
    after: "The free scorer path turned weak points into a stronger paid brief for script, video direction and campaign assets.",
    cta: "Open free ad scorer",
    href: "/free-tools/ad-performance-score-checker"
  },
  {
    title: "Generic campaign to localized market proof",
    segment: "Cultural localization",
    before: "One generic message was planned for every market.",
    after: "Crelavo maps country-specific hook, proof, CTA and visual direction before production credits are spent.",
    cta: "View localization proof",
    href: "/ai-cultural-localization"
  },
  {
    title: "Approved example to reusable template request",
    segment: "Community Showcase",
    before: "A visitor liked a public example but did not know how to request a similar output.",
    after: "The approved example becomes a reusable template angle with credit range and Assistant Workspace route.",
    cta: "Open Community Showcase",
    href: "/community-showcase"
  }
];

export const socialProofAdminChecklist = [
  "Keep testimonials conservative until real customer quotes are approved.",
  "Use role-based proof labels instead of fake names when the quote is an internal MVP proof placeholder.",
  "Connect every case study to a live URL, free tool, showcase page or pricing path.",
  "Replace placeholder proof with real customer approval screenshots after launch review.",
  "Do not claim revenue lift, ROAS or conversion percentage unless the source is verified."
];

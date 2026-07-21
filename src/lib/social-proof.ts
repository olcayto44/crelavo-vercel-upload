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

export type TrustedProofSlot = {
  label: string;
  segment: string;
  status: string;
  note: string;
};

export type VerifiedMetricSlot = {
  label: string;
  sourceRequired: string;
  displayRule: string;
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

export const trustedProofSlots: TrustedProofSlot[] = [
  {
    label: "Shopify product ad demo case",
    segment: "Ecommerce proof",
    status: "Sample workflow",
    note: "Product URL, offer, hook and CTA are turned into a review-ready campaign brief without showing unapproved brand marks."
  },
  {
    label: "Marketplace ad score demo",
    segment: "Marketplace proof",
    status: "30% stronger demo score",
    note: "Example scoring path shows a weak product ad brief improving after hook, proof and CTA cleanup."
  },
  {
    label: "DTC brand video example",
    segment: "Product video proof",
    status: "Example delivery path",
    note: "A product story is mapped into video direction, captions, landing copy and dashboard delivery notes."
  },
  {
    label: "Agency handoff sample",
    segment: "Delivery proof",
    status: "Demo case",
    note: "Campaign assets, source files, README notes and revision status are organized as a client handoff package."
  }
];

export const verifiedMetricSlots: VerifiedMetricSlot[] = [
  {
    label: "Cost reduction claim",
    sourceRequired: "Customer-approved ad account or campaign report",
    displayRule: "Do not publish percentage claims such as lower CAC, ROAS lift or cost reduction until the source is verified."
  },
  {
    label: "Revenue or conversion lift",
    sourceRequired: "Customer-approved analytics screenshot or written case-study approval",
    displayRule: "Show as a private admin note until the customer approves the exact metric and time window."
  },
  {
    label: "Time saved / faster production",
    sourceRequired: "Customer quote, delivery log or internal production comparison",
    displayRule: "Use only with a clear baseline and avoid vague superlatives."
  }
];

export const caseStudyProofs: CaseStudyProof[] = [
  {
    title: "Weak product ad to 30% stronger demo score",
    segment: "Ecommerce ad scoring",
    before: "A product hook, CTA and offer were unclear before spending budget.",
    after: "The demo scorer path shows a 30% stronger campaign readiness score after hook, proof and CTA cleanup.",
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
  "Do not claim revenue lift, ROAS or conversion percentage unless the source is verified.",
  "Keep logo slots as placeholders until each Shopify, Amazon, DTC or agency customer gives explicit public permission.",
  "Store every metric source before publishing percentage claims on the homepage, alternatives pages or service pages."
];

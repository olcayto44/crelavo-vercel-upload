export type CommunityShowcaseTemplate = {
  title: string;
  category: string;
  creditRange: string;
  reusePath: string;
  proofAngle: string;
};

export type CommunityShowcaseApprovalStep = {
  step: string;
  owner: string;
  check: string;
};

export type CommunityShowcaseProofLoop = {
  title: string;
  status: string;
  text: string;
};

export type CommunityShowcaseSubmissionRule = {
  title: string;
  check: string;
};

export const communityShowcaseProofLoop: CommunityShowcaseProofLoop[] = [
  {
    title: "Made with Crelavo AI proof",
    status: "Watermarked preview",
    text: "Approved preview outputs can be shared with a visible Crelavo watermark so visitors understand the result came from Crelavo before clean export is unlocked."
  },
  {
    title: "Share-to-earn review",
    status: "Manual credits",
    text: "Public posts, case studies and community examples can enter manual reward review; no automatic credits are created from unverified social activity."
  },
  {
    title: "Use this style CTA",
    status: "Credit path",
    text: "Every public example should lead to a similar-style dashboard request, pricing guidance or Assistant Workspace brief instead of a vague gallery dead end."
  },
  {
    title: "Private asset protection",
    status: "Rights first",
    text: "Client products, store data, private URLs, faces, invoices or unreleased campaign assets stay unpublished unless explicit permission is confirmed."
  }
];

export const communityShowcaseSubmissionRules: CommunityShowcaseSubmissionRule[] = [
  { title: "Permission", check: "Only submit assets you own or have written permission to show publicly." },
  { title: "No private client data", check: "Remove order numbers, customer names, unreleased product details, private dashboards and confidential URLs." },
  { title: "No inflated claims", check: "Use proof language like concept, preview, example or case study; do not promise ROAS, sales lift or guaranteed results." },
  { title: "Reward review", check: "Submission can be considered for Crelavo credit rewards only after quality, rights, attribution and abuse review." }
];

export const communityShowcaseTemplates: CommunityShowcaseTemplate[] = [
  {
    title: "UGC product demo remix",
    category: "Ecommerce video",
    creditRange: "1,500–3,500 credits",
    reusePath: "Turn an approved UGC demo into a new product script, shot direction and creator-style video request.",
    proofAngle: "Best for showing how one product example becomes a repeatable seller template."
  },
  {
    title: "Before / after ad improvement",
    category: "Ad scoring",
    creditRange: "750–2,000 credits",
    reusePath: "Use an approved weak-to-strong ad example as a structure for hook, CTA and offer improvement.",
    proofAngle: "Best for visitors who need proof before spending full campaign credits."
  },
  {
    title: "Website hero rebuild",
    category: "Website / landing page",
    creditRange: "2,500–6,000 credits",
    reusePath: "Convert a public website example into a similar hero, offer section and conversion-focused landing brief.",
    proofAngle: "Best for founders comparing AI website production and human QA polish."
  },
  {
    title: "Localized campaign variant",
    category: "Localization",
    creditRange: "2,000–5,000 credits",
    reusePath: "Adapt an approved campaign example into a country-specific hook, proof angle, CTA and visual direction.",
    proofAngle: "Best for ecommerce teams entering a new market."
  }
];

export const communityShowcaseApprovalFlow: CommunityShowcaseApprovalStep[] = [
  {
    step: "Submission review",
    owner: "Admin",
    check: "Confirm the example is safe to show publicly, has no private client data and can be described without overstating results."
  },
  {
    step: "Template extraction",
    owner: "Admin + Assistant",
    check: "Turn the approved example into reusable ingredients: category, hook logic, visual style, delivery notes and credit range."
  },
  {
    step: "Credit route",
    owner: "Admin",
    check: "Map the template to an existing package or a custom dashboard credit request before production starts."
  },
  {
    step: "Public publish",
    owner: "Admin",
    check: "Publish only the approved title, proof angle, reusable prompt direction and CTA into Assistant Workspace."
  }
];

export const communityShowcaseAdminChecklist = [
  "Keep every public item manually approved before it appears on the showcase page.",
  "Attach a reuse prompt and credit estimate to every approved example.",
  "Do not promise automatic creator rewards until payment, rights and attribution checks are live.",
  "Use Crelavo credits first for template reuse and creator rewards; cash payouts stay later.",
  "Route every similar-style request into dashboard credits or Assistant Workspace with AI + human QA review.",
  "Use watermarked preview proof for public share loops; unlock clean export only after payment and plan eligibility are confirmed.",
  "Keep private client assets, confidential store data and unapproved faces out of public showcase cards."
];

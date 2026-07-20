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
  "Route every similar-style request into dashboard credits or Assistant Workspace with AI + human QA review."
];

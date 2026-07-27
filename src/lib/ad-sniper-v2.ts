export const adSniperV2Plan = {
  name: "AI Ad Re-Creator / Sniper V2",
  positioning: "Analyze a public reference ad for structure, then create an original Crelavo campaign for the user's own product without copying protected creative.",
  allowedInputs: [
    "Public ad URL or screenshot notes",
    "Transcript or manually pasted competitor ad copy for analysis",
    "User's own product URL, product images, brand assets and offer details",
    "Target market, language, channel and localization goals"
  ],
  extractedStructureOnly: [
    "hook type",
    "pacing pattern",
    "scene order",
    "problem-solution logic",
    "proof moment category",
    "CTA role",
    "format and localization notes"
  ],
  prohibitedReuse: [
    "competitor footage",
    "competitor logo or trade dress",
    "exact script or slogan",
    "music/soundtrack",
    "faces, creator likeness or voice",
    "watermarks or platform identifiers"
  ],
  outputPlan: [
    "reference structure report",
    "original product-specific hook set",
    "fresh scene plan using user's own product/assets",
    "localized CTA and offer rewrite",
    "copyright-safe production brief",
    "rights confirmation checklist before generation"
  ],
  consentCheckbox: "I confirm I own or have permission to use the product assets I upload, and I understand Crelavo will not copy competitor footage, logos, music, faces, voices or exact ad copy.",
  publicLanguageGuard: "Use 'reference ad analysis' or 'original ad recreation from structure'; avoid risky language such as clone competitor ad or copy their winning creative."
};

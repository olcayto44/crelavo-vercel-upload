import { deliveryPackageForProduction, type DeliveryPackage } from "./delivery-package.ts";
import { buildOutputRegistry } from "./output-registry.ts";
import { qualityProfileForProduction, type ProductionQualityProfile } from "./production-quality.ts";

type ProductionLike = {
  id: string;
  title?: string | null;
  prompt?: string | null;
  production_type?: string | null;
  package_id?: string | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
  materials_json?: Array<Record<string, any>> | null;
  output_json?: Record<string, any> | null;
  features?: string | null;
  target_platform?: string | null;
  social_platforms?: string | null;
  publish_targets?: string[] | null;
};

export type AutomaticDeliveryLinks = {
  previewUrl: string;
  deliveryZipUrl: string;
  sourceFilesUrl: string;
  readmeUrl: string;
  deliveryLink: string;
};

function basePath(productionId: string) {
  return `/api/productions/${productionId}/delivery`;
}

export function automaticDeliveryLinks(productionId: string): AutomaticDeliveryLinks {
  const base = basePath(productionId);
  return {
    previewUrl: `${base}?file=preview`,
    deliveryZipUrl: `${base}?file=zip`,
    sourceFilesUrl: `${base}?file=source`,
    readmeUrl: `${base}?file=readme`,
    deliveryLink: `${base}?file=manifest`
  };
}

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function value(value: unknown, fallback = "Not specified") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function objectValue(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function deliveryRequirementsFromProduction(production: ProductionLike) {
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const requirements = objectValue(metadata.deliveryRequirements) ?? objectValue(input.deliveryRequirements);
  const formats = Array.isArray(requirements?.formats) ? requirements.formats.map(String) : [];
  return {
    requested: Boolean(requirements?.requested ?? formats.length > 0),
    status: String(requirements?.status ?? "pending"),
    formats: formats.length ? formats : ["dashboard_delivery"],
    wantsZip: Boolean(requirements?.wantsZip ?? formats.includes("final_zip")),
    wantsSourceCode: Boolean(requirements?.wantsSourceCode ?? formats.includes("source_code")),
    wantsReadme: Boolean(requirements?.wantsReadme ?? formats.includes("readme")),
    wantsDeploymentGuide: Boolean(requirements?.wantsDeploymentGuide ?? formats.includes("deployment_guide")),
    wantsAdminPanel: Boolean(requirements?.wantsAdminPanel ?? formats.includes("admin_panel")),
    wantsFinalVideo: Boolean(requirements?.wantsFinalVideo ?? formats.includes("final_mp4")),
    wantsSubtitles: Boolean(requirements?.wantsSubtitles ?? formats.includes("subtitle_file")),
    wantsThumbnail: Boolean(requirements?.wantsThumbnail ?? formats.includes("thumbnail")),
    wantsPdf: Boolean(requirements?.wantsPdf ?? formats.includes("pdf")),
    wantsBrandKit: Boolean(requirements?.wantsBrandKit ?? formats.includes("brand_kit")),
    packageNote: String(requirements?.packageNote ?? "Delivery requirements are generated from the production wizard.")
  };
}

export function deliveryPackageFromProduction(production: ProductionLike): DeliveryPackage {
  const metadata = production.request_metadata ?? {};
  if (metadata.deliveryPackage && typeof metadata.deliveryPackage === "object") return metadata.deliveryPackage as DeliveryPackage;
  return deliveryPackageForProduction({
    productionType: String(production.production_type ?? "general"),
    packageId: String(production.package_id ?? ""),
    features: String(metadata.features ?? production.input_json?.features ?? ""),
    storePlatform: String(metadata.commerceWorkflow?.storePlatform ?? ""),
    sourceDelivery: String(metadata.projectWorkflow?.sourceDelivery ?? "")
  });
}

export function productionQualityFromProduction(production: ProductionLike): ProductionQualityProfile {
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  if (metadata.productionQuality && typeof metadata.productionQuality === "object") return metadata.productionQuality as ProductionQualityProfile;
  if (input.productionQuality && typeof input.productionQuality === "object") return input.productionQuality as ProductionQualityProfile;
  return qualityProfileForProduction(String(production.production_type ?? "video"), String(production.package_id ?? ""));
}

export function buildDeliveryManifest(production: ProductionLike) {
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const deliveryPackage = deliveryPackageFromProduction(production);
  const deliveryRequirements = deliveryRequirementsFromProduction(production);
  const productionQuality = productionQualityFromProduction(production);
  const links = automaticDeliveryLinks(production.id);
  const generatedFiles = plannedDeliveryFileList(production, deliveryRequirements);
  const outputRegistry = buildOutputRegistry(production);
  return {
    production_id: production.id,
    title: value(production.title, "Crelavo production"),
    production_type: value(production.production_type, "general"),
    package_id: value(production.package_id, "unknown_package"),
    delivery_standard: deliveryPackage.standard,
    user_promise: deliveryPackage.userPromise,
    required_items: deliveryPackage.requiredItems,
    optional_items: deliveryPackage.optionalItems,
    file_formats: deliveryPackage.fileFormats,
    dashboard_fields: deliveryPackage.dashboardFields,
    delivery_requirements: deliveryRequirements,
    production_quality: productionQuality,
    generated_files: generatedFiles,
    output_registry: outputRegistry,
    project: {
      modules: value(metadata.projectWorkflow?.modules ?? input.projectWorkflow?.modules),
      technical_stack: value(metadata.projectWorkflow?.technicalStack ?? input.projectWorkflow?.technicalStack),
      source_delivery: value(metadata.projectWorkflow?.sourceDelivery ?? input.projectWorkflow?.sourceDelivery)
    },
    commerce: {
      store_platform: value(metadata.commerceWorkflow?.storePlatform ?? input.commerceWorkflow?.storePlatform),
      store_asset_goal: value(metadata.commerceWorkflow?.storeAssetGoal ?? input.commerceWorkflow?.storeAssetGoal),
      connected_store_targets: value(metadata.commerceWorkflow?.connectedStoreTargets ?? input.commerceWorkflow?.connectedStoreTargets)
    },
    reference_link_safety: value(metadata.referenceLinkSafety ?? input.referenceLinkSafety, "References are used for analysis and inspiration only; final outputs must be original."),
    materials: Array.isArray(production.materials_json) ? production.materials_json.map((item) => ({ title: item.title ?? item.id ?? "Material", type: item.type ?? item.kind ?? "material", url: item.file_url ?? item.preview_url ?? item.previewUrl ?? null })) : [],
    links
  };
}

export function buildDeliveryReadme(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# ${manifest.title}\n\n## Delivery Standard\n${manifest.delivery_standard}\n\n${manifest.user_promise}\n\n## Required Delivery Items\n${list(manifest.required_items)}\n\n## Production Quality Standard\n${manifest.production_quality.minimumStandard}\n\nCustomer-ready definition: ${manifest.production_quality.customerReadyDefinition}\n\n### Quality Checklist\n${list(manifest.production_quality.checklist)}\n\n### Acceptance Criteria\n${list(manifest.production_quality.acceptanceCriteria)}\n\n## Optional / Included When Available\n${list(manifest.optional_items)}\n\n## Expected File Formats\n${list(manifest.file_formats)}\n\n## Project / Technical Notes\n- Modules: ${manifest.project.modules}\n- Technical stack: ${manifest.project.technical_stack}\n- Source delivery: ${manifest.project.source_delivery}\n\n## Store / Marketplace Notes\n- Store platform: ${manifest.commerce.store_platform}\n- Store asset goal: ${manifest.commerce.store_asset_goal}\n- Connected store targets: ${manifest.commerce.connected_store_targets}\n\n## Reference Link Safety\n${manifest.reference_link_safety}\n\n## How to Use\n1. Open the preview link from the dashboard.\n2. Download the delivery ZIP/source package.\n3. Read setup or platform notes before publishing.\n4. Use the revision area if any required item is missing or needs adjustment.\n\n## Dashboard Links\n- Preview: ${manifest.links.previewUrl}\n- Delivery ZIP: ${manifest.links.deliveryZipUrl}\n- Source files: ${manifest.links.sourceFilesUrl}\n- Manifest: ${manifest.links.deliveryLink}\n`;
}

export function buildSourceGuide(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Source / Export Guide\n\nProduction: ${manifest.title}\nType: ${manifest.production_type}\nPackage: ${manifest.package_id}\n\n## What This Package Is For\n${manifest.user_promise}\n\n## Use In Website / Store / App\n- Review all files before publishing.\n- Replace placeholder copy, images, product data or credentials with your own verified business data.\n- Do not publish third-party reference content one-to-one.\n- Keep this README with the source/export files for future revisions.\n\n## Requested Delivery Requirements\n${list(manifest.delivery_requirements.formats)}\n\n## Required Checklist\n${list(manifest.required_items)}\n\n## Production Quality Checklist\n${list(manifest.production_quality.checklist)}\n\n## Generated Package Files\n${list(manifest.generated_files.map((file: { path: string }) => file.path))}\n\n## Formats\n${list(manifest.file_formats)}\n`;
}

function plannedDeliveryFileList(production: ProductionLike, requirements: ReturnType<typeof deliveryRequirementsFromProduction>) {
  const type = String(production.production_type ?? "general");
  const files = [
    { path: "README.md", purpose: "Customer instructions and delivery overview" },
    { path: "manifest.json", purpose: "Machine-readable delivery manifest" },
    { path: "preview.html", purpose: "Browser preview of the delivery package" }
  ];
  if (requirements.wantsSourceCode || ["website", "saas", "mobile_app", "admin_project"].includes(type)) {
    files.push({ path: "source/SOURCE-GUIDE.md", purpose: "Source package guide" });
    files.push({ path: "source/project-structure.md", purpose: "Suggested source structure and file map" });
  }
  if (type === "campaign" || deliveryPackageFromProduction(production).standard === "commerce_export") {
    files.push({ path: "campaign/copy-pack.md", purpose: "Ad script, captions, subtitle lines and CTA variations" });
    files.push({ path: "campaign/social-export-plan.md", purpose: "TikTok, Meta, Instagram, YouTube and marketplace export checklist" });
    files.push({ path: "campaign/marketplace-export.json", purpose: "Machine-readable campaign asset export map" });
  }
  if (isSocialContentDelivery(production)) {
    files.push({ path: "social/caption-pack.md", purpose: "Platform captions, hashtags, hooks and post angles" });
    files.push({ path: "social/posting-calendar.md", purpose: "7-day social posting calendar" });
    files.push({ path: "social/platform-format-plan.json", purpose: "Per-platform format and asset map" });
  }
  if (isGrowthDelivery(production)) {
    files.push({ path: "growth/conversion-funnel-plan.md", purpose: "Lead capture, activation, monetization and retention funnel" });
    files.push({ path: "growth/monetization-plan.json", purpose: "Whop, credits, referral and retention loop map" });
    files.push({ path: "growth/lifecycle-nudges.md", purpose: "Signup, delivery and reactivation nudges" });
  }
  if (requirements.wantsAdminPanel) files.push({ path: "admin-panel/admin-requirements.md", purpose: "Admin panel modules, roles and data notes" });
  if (requirements.wantsDeploymentGuide) files.push({ path: "docs/deployment-guide.md", purpose: "Deployment and setup instructions" });
  if (requirements.wantsFinalVideo) files.push({ path: "media/final-video-placeholder.md", purpose: "Final video slot and provider replacement notes" });
  if (requirements.wantsSubtitles) files.push({ path: "media/subtitles-template.srt", purpose: "Subtitle file template" });
  if (requirements.wantsThumbnail) files.push({ path: "media/thumbnail-brief.md", purpose: "Thumbnail requirements and replacement slot" });
  if (requirements.wantsPdf) files.push({ path: "documents/final-document.md", purpose: "Document/PDF source content" });
  if (requirements.wantsBrandKit) files.push({ path: "brand-kit/brand-guide.md", purpose: "Brand kit guide, palette and asset notes" });
  if (requirements.wantsZip) files.push({ path: "delivery-package-notes.md", purpose: "ZIP package contents and completion checklist" });
  return files;
}

function buildProjectStructure(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Project Structure\n\nProduction: ${manifest.title}\n\n## Recommended Package Layout\n\n\`\`\`text\ndelivery/\n├─ README.md\n├─ manifest.json\n├─ preview.html\n├─ source/\n│  ├─ app/page.tsx\n│  ├─ app/layout.tsx\n│  ├─ app/globals.css\n│  ├─ components/\n│  ├─ lib/config.ts\n│  └─ package.json\n├─ admin-panel/\n├─ docs/\n├─ media/\n├─ brand-kit/\n└─ documents/\n\`\`\`\n\n## Technical Stack\n${manifest.project.technical_stack}\n\n## Modules\n${manifest.project.modules}\n`;
}

function buildSourcePackageJson(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const safeName = manifest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "crelavo-project";
  return JSON.stringify({
    name: safeName,
    version: "0.1.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
    dependencies: { "@supabase/supabase-js": "latest", next: "latest", react: "latest", "react-dom": "latest" },
    devDependencies: { typescript: "latest", "@types/node": "latest", "@types/react": "latest", "@types/react-dom": "latest" }
  }, null, 2);
}

function buildSourceConfig(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `export const projectConfig = ${JSON.stringify({
    title: manifest.title,
    type: manifest.production_type,
    packageId: manifest.package_id,
    modules: manifest.project.modules,
    stack: manifest.project.technical_stack,
    commerce: manifest.commerce,
    deliveryStandard: manifest.delivery_standard
  }, null, 2)} as const;\n`;
}

function buildSourceLayout(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `import "./globals.css";\n\nexport const metadata = { title: ${JSON.stringify(manifest.title)}, description: ${JSON.stringify(manifest.user_promise)} };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n`;
}

function buildSourcePage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const items = manifest.required_items.map((item) => `          <li>${item}</li>`).join("\n");
  return `import { projectConfig } from "../lib/config";\n\nexport default function Page() {\n  return (\n    <main className="page-shell">\n      <section className="hero">\n        <span>${manifest.delivery_standard}</span>\n        <h1>{projectConfig.title}</h1>\n        <p>${manifest.user_promise}</p>\n      </section>\n      <section className="card">\n        <h2>Included delivery</h2>\n        <ul>\n${items}\n        </ul>\n      </section>\n      <section className="card">\n        <h2>Modules</h2>\n        <p>{projectConfig.modules}</p>\n      </section>\n    </main>\n  );\n}\n`;
}

function buildSourceCss() {
  return `:root { color-scheme: dark; font-family: Inter, Arial, sans-serif; background: #020617; color: #e5e7eb; }\nbody { margin: 0; }\n.page-shell { max-width: 980px; margin: 0 auto; padding: 48px 24px; }\n.hero, .card { border: 1px solid #243044; background: #0f172a; border-radius: 24px; padding: 28px; margin-bottom: 18px; }\n.hero span { color: #93c5fd; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }\nh1 { font-size: clamp(34px, 6vw, 68px); line-height: 1; margin: 18px 0; }\np, li { color: #cbd5e1; line-height: 1.7; }\n`;
}

function buildAdminRequirements(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Admin Panel Requirements\n\nProduction: ${manifest.title}\n\n## Required Admin Scope\n- Content management\n- User/request management\n- Delivery file management\n- Status updates\n- Revision handling\n\n## Project Modules\n${manifest.project.modules}\n\n## Notes\nAdmin screens must match the selected production scope and should be included in the final source or delivery guide when requested.\n`;
}

function buildDeploymentGuide(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Deployment Guide\n\nProduction: ${manifest.title}\n\n## Before Deploying\n- Review README.md and manifest.json.\n- Replace placeholders with verified business data.\n- Confirm all requested delivery requirements are present.\n\n## Suggested Stack\n${manifest.project.technical_stack}\n\n## Delivery Links\n- Preview: ${manifest.links.previewUrl}\n- ZIP: ${manifest.links.deliveryZipUrl}\n- Source guide: ${manifest.links.sourceFilesUrl}\n`;
}

function buildMediaPlaceholder(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Final Video Slot\n\nProduction: ${manifest.title}\n\nThe real final MP4 should replace this placeholder when provider generation or admin upload completes.\n\nRequested formats: ${manifest.delivery_requirements.formats.join(", ")}\n`;
}

function buildSubtitlesTemplate() {
  return `1\n00:00:00,000 --> 00:00:03,000\nReplace with final subtitle line.\n\n2\n00:00:03,000 --> 00:00:06,000\nReplace with final subtitle line.\n`;
}

function buildThumbnailBrief(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Thumbnail Brief\n\nProduction: ${manifest.title}\n\nCreate or upload a thumbnail matching the final output, platform and campaign goal.\n`;
}

function buildDocumentSource(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Final Document Source\n\nProduction: ${manifest.title}\n\nThis file is the editable source for the requested PDF/document delivery.\n\n## Brief\n${value(production.prompt, "No prompt supplied")}\n`;
}

function buildBrandGuide(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Brand Guide\n\nProduction: ${manifest.title}\n\n## Included Sections\n- Logo usage\n- Palette\n- Typography\n- Social asset notes\n- Usage rules\n`;
}

function buildZipNotes(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Delivery Package Notes\n\nThis ZIP was generated from Crelavo delivery requirements.\n\n## Requested Formats\n${list(manifest.delivery_requirements.formats)}\n\n## Files Planned\n${list(manifest.generated_files.map((file: { path: string; purpose: string }) => `${file.path} — ${file.purpose}`))}\n`;
}

function buildCampaignCopyPack(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const output = objectValue(production.output_json) ?? objectValue(input.output_json) ?? objectValue(metadata.output_json) ?? {};
  const brain = objectValue(output.brain) ?? {};
  const script = value(brain.voiceoverScript ?? production.prompt, "Replace with final approved ad script.");
  const subtitles = Array.isArray(brain.subtitleLines) ? brain.subtitleLines.map(String) : ["Hook subtitle", "Product benefit", "Proof", "CTA"];
  return `# Campaign Copy Pack\n\nProduction: ${manifest.title}\n\n## Voice-over / Script\n${script}\n\n## Subtitle Lines\n${list(subtitles)}\n\n## Platform Captions\n- TikTok: Hook-first caption + product benefit + CTA.\n- Instagram Reels: Short benefit-led caption + trust cue + CTA.\n- Meta Ads: Primary text, headline and description should use the offer angle.\n- YouTube Shorts: Search-friendly title + concise CTA.\n\n## CTA Variations\n- Shop now\n- See the product\n- Get yours today\n- Try it before competitors catch up\n`;
}

function buildSocialExportPlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Social / Ads Export Plan\n\nProduction: ${manifest.title}\n\n## Export Targets\n${list(["TikTok", "Instagram Reels", "Facebook/Meta Ads", "YouTube Shorts", "Shopify", "Amazon", "Trendyol", "WooCommerce"])}\n\n## Launch Checklist\n- Confirm final video opens in dashboard.\n- Confirm subtitles are readable on mobile.\n- Confirm product/offer claim is accurate.\n- Upload to connected platforms or use manual export if OAuth/account token is not connected.\n- Track spend, clicks, conversions and ROAS after launch.\n`;
}

function buildMarketplaceExportJson(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return JSON.stringify({
    production_id: manifest.production_id,
    title: manifest.title,
    platforms: ["shopify", "amazon", "trendyol", "woocommerce", "meta", "tiktok", "youtube_shorts"],
    assets: {
      final_video: manifest.links.previewUrl,
      delivery_zip: manifest.links.deliveryZipUrl,
      readme: manifest.links.readmeUrl
    },
    copy_slots: {
      primary_text: "Replace with final approved primary text.",
      headline: "Replace with final approved headline.",
      description: "Replace with final approved description.",
      call_to_action: "Shop now"
    }
  }, null, 2);
}

function isSocialContentDelivery(production: ProductionLike) {
  const textBlock = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.features ?? ""} ${production.target_platform ?? ""} ${production.social_platforms ?? ""} ${production.publish_targets ?? ""}`.toLowerCase();
  return /social|tiktok|reels|shorts|instagram|youtube|facebook|linkedin|twitter|x\/twitter|caption|hashtag|ugc/.test(textBlock);
}

function buildSocialCaptionPack(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Social Caption Pack\n\nProduction: ${manifest.title}\n\n## TikTok\n- Hook: Stop scrolling if you want this result faster.\n- Caption: ${manifest.title} — built for quick proof, clear benefit and direct action.\n- Hashtags: #aitools #productivity #smallbusiness #crelavo\n\n## Instagram Reels\n- Caption: A cleaner way to turn ideas into production-ready assets.\n- Hashtags: #reelsmarketing #aicontent #digitalproduct #brandgrowth\n\n## YouTube Shorts\n- Title: ${manifest.title} in under 60 seconds\n- Description: Fast preview, clear CTA and dashboard delivery.\n\n## LinkedIn / X\n- Post angle: Show the business problem, the output, and the action customers can take next.\n`;
}

function buildSocialPostingCalendar(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Social Posting Calendar\n\nProduction: ${manifest.title}\n\n## 7-Day Starter Plan\n- Day 1: Launch teaser / hook video.\n- Day 2: Problem-solution post.\n- Day 3: Behind-the-scenes or dashboard screenshot.\n- Day 4: Benefit-led short clip.\n- Day 5: FAQ / objection response.\n- Day 6: Proof or sample output.\n- Day 7: CTA recap and offer reminder.\n\n## Review Rule\nManual approval is required before publishing. Connected APIs may prepare launch jobs, but paid spend and direct posting should wait for approval.\n`;
}

function buildPlatformFormatPlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return JSON.stringify({
    production_id: manifest.production_id,
    title: manifest.title,
    formats: {
      tiktok: { ratio: "9:16", length: "15-60s", assets: ["caption", "hashtags", "cover text", "CTA"] },
      instagram_reels: { ratio: "9:16", length: "15-90s", assets: ["caption", "hashtags", "story teaser"] },
      youtube_shorts: { ratio: "9:16", length: "15-60s", assets: ["title", "description", "hashtags", "pinned comment"] },
      meta_ads: { ratio: "9:16 / 4:5 / 1:1", assets: ["primary text", "headline", "description", "CTA"] },
      linkedin_x: { ratio: "feed", assets: ["short post", "thread outline", "link CTA", "UTM note"] }
    }
  }, null, 2);
}

function isGrowthDelivery(production: ProductionLike) {
  const textBlock = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.features ?? ""} ${production.target_platform ?? ""} ${production.prompt ?? ""}`.toLowerCase();
  return /growth|conversion|monetization|affiliate|referral|share-to-earn|lead|funnel|retention|whop|checkout|upsell/.test(textBlock);
}

function buildConversionFunnelPlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Conversion Funnel Plan\n\nProduction: ${manifest.title}\n\n## Funnel Steps\n- Visit: preserve landing path, referrer and UTM attribution.\n- Lead capture: offer a safe guide/preview/support reason to leave email.\n- Signup: route to dashboard and first production intent.\n- First production: start only after credits/payment/scope are confirmed.\n- Delivery viewed: suggest second action, social export, referral or upgrade.\n- Whop checkout: keep setup fee, preview and subscription terms clear.\n\n## Guardrail\nNo fake production claims and no automatic credit awards without verification.\n`;
}

function buildGrowthMonetizationPlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return JSON.stringify({
    production_id: manifest.production_id,
    title: manifest.title,
    loops: {
      lead_capture: ["exit_intent", "preview_support", "free_tool_handoff"],
      activation: ["assistant_workspace", "first_production_request", "dashboard_delivery"],
      monetization: ["whop_preview_fee", "subscription_upgrade", "credit_topup", "business_team_plan"],
      retention: ["next_best_action", "social_export", "growth_rewards", "growth_intelligence"],
      referral: ["share_to_earn", "partner_link", "case_study_review"]
    },
    approval_rules: ["manual reward review", "Whop payment validation", "fraud/idempotency check", "no paid spend without approval"]
  }, null, 2);
}

function buildLifecycleNudgePlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Lifecycle Nudge Plan\n\nProduction: ${manifest.title}\n\n- New signup, no production: invite to Assistant Workspace.\n- Production started, not delivered: remind missing assets/status.\n- Delivered, no second action: suggest ad creative, landing page, social kit or Growth Intelligence.\n- Low credits / checkout intent: show Whop-safe top-up path.\n- Inactive user: send low-volume manual reminder with free tool/sample CTA.\n`;
}

export function buildDeliveryEntries(production: ProductionLike): ZipEntry[] {
  const manifest = buildDeliveryManifest(production);
  const requirements = manifest.delivery_requirements;
  const entries: ZipEntry[] = [
    { name: "README.md", content: buildDeliveryReadme(production) },
    { name: "SOURCE-GUIDE.md", content: buildSourceGuide(production) },
    { name: "manifest.json", content: JSON.stringify(manifest, null, 2) },
    { name: "preview.html", content: buildPreviewHtml(production) }
  ];
  if (requirements.wantsSourceCode || ["website", "saas", "mobile_app", "admin_project"].includes(manifest.production_type)) {
    entries.push({ name: "source/project-structure.md", content: buildProjectStructure(production) });
    entries.push({ name: "source/package.json", content: buildSourcePackageJson(production) });
    entries.push({ name: "source/app/layout.tsx", content: buildSourceLayout(production) });
    entries.push({ name: "source/app/page.tsx", content: buildSourcePage(production) });
    entries.push({ name: "source/app/globals.css", content: buildSourceCss() });
    entries.push({ name: "source/lib/config.ts", content: buildSourceConfig(production) });
  }
  if (manifest.delivery_standard === "commerce_export" || manifest.production_type === "campaign") {
    entries.push({ name: "campaign/copy-pack.md", content: buildCampaignCopyPack(production) });
    entries.push({ name: "campaign/social-export-plan.md", content: buildSocialExportPlan(production) });
    entries.push({ name: "campaign/marketplace-export.json", content: buildMarketplaceExportJson(production) });
  }
  if (isSocialContentDelivery(production)) {
    entries.push({ name: "social/caption-pack.md", content: buildSocialCaptionPack(production) });
    entries.push({ name: "social/posting-calendar.md", content: buildSocialPostingCalendar(production) });
    entries.push({ name: "social/platform-format-plan.json", content: buildPlatformFormatPlan(production) });
  }
  if (isGrowthDelivery(production)) {
    entries.push({ name: "growth/conversion-funnel-plan.md", content: buildConversionFunnelPlan(production) });
    entries.push({ name: "growth/monetization-plan.json", content: buildGrowthMonetizationPlan(production) });
    entries.push({ name: "growth/lifecycle-nudges.md", content: buildLifecycleNudgePlan(production) });
  }
  if (requirements.wantsAdminPanel) entries.push({ name: "admin-panel/admin-requirements.md", content: buildAdminRequirements(production) });
  if (requirements.wantsDeploymentGuide) entries.push({ name: "docs/deployment-guide.md", content: buildDeploymentGuide(production) });
  if (requirements.wantsFinalVideo) entries.push({ name: "media/final-video-placeholder.md", content: buildMediaPlaceholder(production) });
  if (requirements.wantsSubtitles) entries.push({ name: "media/subtitles-template.srt", content: buildSubtitlesTemplate() });
  if (requirements.wantsThumbnail) entries.push({ name: "media/thumbnail-brief.md", content: buildThumbnailBrief(production) });
  if (requirements.wantsPdf) entries.push({ name: "documents/final-document.md", content: buildDocumentSource(production) });
  if (requirements.wantsBrandKit) entries.push({ name: "brand-kit/brand-guide.md", content: buildBrandGuide(production) });
  if (requirements.wantsZip) entries.push({ name: "delivery-package-notes.md", content: buildZipNotes(production) });
  return entries;
}

export function buildPreviewHtml(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const items = manifest.required_items.map((item) => `<li>${item}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${manifest.title}</title><style>body{font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e5e7eb;margin:0;padding:32px}main{max-width:880px;margin:auto;background:#111827;border:1px solid #334155;border-radius:24px;padding:28px}span{color:#93c5fd;text-transform:uppercase;font-size:12px;letter-spacing:.12em}h1{font-size:34px}li{margin:8px 0}.card{background:#020617;border:1px solid #1f2937;border-radius:18px;padding:18px;margin-top:18px}</style></head><body><main><span>${manifest.delivery_standard}</span><h1>${manifest.title}</h1><p>${manifest.user_promise}</p><div class="card"><h2>Required delivery items</h2><ul>${items}</ul></div><div class="card"><h2>Production quality</h2><p>${manifest.production_quality.minimumStandard}</p></div><div class="card"><h2>Reference safety</h2><p>${manifest.reference_link_safety}</p></div></main></body></html>`;
}

type ZipEntry = { name: string; content: string };

function crc32(input: Uint8Array) {
  let crc = ~0;
  for (const byte of input) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function u16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export function buildDeliveryZip(entries: ZipEntry[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    localParts.push(local);
    centralParts.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]));
    offset += local.length;
  }

  const central = concat(centralParts);
  const end = concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)]);
  return concat([...localParts, central, end]);
}

import { buildExportReadyPack } from "./connected-accounts.ts";
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
  scope?: string | null;
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

function objectValue(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function deliveryRequirementsFromProduction(production: ProductionLike) {
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const requirements = objectValue(metadata.deliveryRequirements) ?? objectValue(input.deliveryRequirements);
  const rawFormats = Array.isArray(requirements?.formats) ? requirements.formats.map(String) : [];
  const projectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(String(production.production_type ?? ""));
  const formats = projectProduction ? rawFormats.filter((format) => !["final_mp4", "subtitle_file", "thumbnail"].includes(format)) : rawFormats;
  return {
    requested: Boolean(requirements?.requested ?? formats.length > 0),
    status: String(requirements?.status ?? "pending"),
    formats: formats.length ? formats : projectProduction ? ["preview_link", "source_code", "readme", "deployment_guide"] : ["dashboard_delivery"],
    wantsZip: Boolean(requirements?.wantsZip ?? formats.includes("final_zip")),
    wantsSourceCode: projectProduction || Boolean(requirements?.wantsSourceCode ?? formats.includes("source_code")),
    wantsReadme: projectProduction || Boolean(requirements?.wantsReadme ?? formats.includes("readme")),
    wantsDeploymentGuide: Boolean(requirements?.wantsDeploymentGuide ?? formats.includes("deployment_guide")),
    wantsAdminPanel: Boolean(requirements?.wantsAdminPanel ?? formats.includes("admin_panel")),
    wantsFinalVideo: !projectProduction && Boolean(requirements?.wantsFinalVideo ?? formats.includes("final_mp4")),
    wantsSubtitles: !projectProduction && Boolean(requirements?.wantsSubtitles ?? formats.includes("subtitle_file")),
    wantsThumbnail: !projectProduction && Boolean(requirements?.wantsThumbnail ?? formats.includes("thumbnail")),
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
  const scope = String(metadata.scope ?? input.scope ?? production.scope ?? production.output_json?.scope ?? "marketing_website") === "website_with_admin" ? "website_with_admin" : "marketing_website";
  const generatedFiles = plannedDeliveryFileList(production, deliveryRequirements);
  const outputRegistry = buildOutputRegistry(production);
  return {
    production_id: production.id,
    title: value(production.title, "Crelavo production"),
    production_type: value(production.production_type, "general"),
    package_id: value(production.package_id, "unknown_package"),
    scope,
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
      modules: value(metadata.projectWorkflow?.modules ?? input.projectWorkflow?.modules, projectFeatureSet(production).entities.join(", ")),
      technical_stack: value(metadata.projectWorkflow?.technicalStack ?? input.projectWorkflow?.technicalStack, deliveryPackage.standard === "commerce_export" ? "Next.js storefront/admin source package, product catalog, cart/checkout flows, marketplace export notes" : deliveryPackage.standard === "project_source" ? "Next.js / Expo source package, TypeScript, responsive UI, dashboard delivery" : deliveryPackage.fileFormats.join(", ")),
      source_delivery: value(metadata.projectWorkflow?.sourceDelivery ?? input.projectWorkflow?.sourceDelivery, deliveryPackage.standard)
    },
    commerce: {
      store_platform: value(metadata.commerceWorkflow?.storePlatform ?? input.commerceWorkflow?.storePlatform ?? production.output_json?.deliveryPreferences?.provider),
      store_asset_goal: value(metadata.commerceWorkflow?.storeAssetGoal ?? input.commerceWorkflow?.storeAssetGoal),
      connected_store_targets: value(metadata.commerceWorkflow?.connectedStoreTargets ?? input.commerceWorkflow?.connectedStoreTargets ?? production.output_json?.deliveryPreferences?.connectedAccountId),
      selected_product_id: value(production.output_json?.deliveryPreferences?.productId, ""),
      selected_product_title: value(production.output_json?.deliveryPreferences?.productTitle, ""),
      product_description: value(production.output_json?.deliveryPreferences?.productDescription, ""),
      product_tags: Array.isArray(production.output_json?.deliveryPreferences?.productTags) ? production.output_json?.deliveryPreferences?.productTags.map(String) : [],
      upload_payload: objectValue(production.output_json?.deliveryPreferences?.uploadPayload) ?? {}
    },
    social_store_export_pack: buildExportReadyPack({
      title: value(production.title, "Crelavo production"),
      mediaUrl: links.previewUrl,
      caption: value(metadata.deliveryPreferences?.caption ?? input.deliveryPreferences?.caption ?? production.output_json?.deliveryPreferences?.caption ?? production.prompt, "Review and edit caption before publishing."),
      hashtags: Array.isArray(production.output_json?.deliveryPreferences?.hashtags) ? production.output_json?.deliveryPreferences?.hashtags.map(String) : undefined,
      productId: value(production.output_json?.deliveryPreferences?.productId, ""),
      productTags: Array.isArray(production.output_json?.deliveryPreferences?.productTags) ? production.output_json?.deliveryPreferences?.productTags.map(String) : undefined,
      targetProviders: ["tiktok", "youtube", "instagram", "meta", "shopify", "woocommerce"]
    }),
    reference_link_safety: value(metadata.referenceLinkSafety ?? input.referenceLinkSafety, "References are used for analysis and inspiration only; final outputs must be original."),
    materials: Array.isArray(production.materials_json) ? production.materials_json.map((item) => ({ title: item.title ?? item.id ?? "Material", type: item.type ?? item.kind ?? "material", url: item.file_url ?? item.preview_url ?? item.previewUrl ?? null })) : [],
    links
  };
}

export function buildDeliveryReadme(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# ${manifest.title}\n\n## Website Scope\n${manifest.scope === "website_with_admin" ? "Public website plus admin panel source starter" : "Public static website; no admin panel is included"}\n\n## Delivery Standard\n${manifest.delivery_standard}\n\n${manifest.user_promise}\n\n## Required Delivery Items\n${list(manifest.required_items)}\n\n## Production Quality Standard\n${manifest.production_quality.minimumStandard}\n\nCustomer-ready definition: ${manifest.production_quality.customerReadyDefinition}\n\n### Quality Checklist\n${list(manifest.production_quality.checklist)}\n\n### Acceptance Criteria\n${list(manifest.production_quality.acceptanceCriteria)}\n\n## Optional / Included When Available\n${list(manifest.optional_items)}\n\n## Expected File Formats\n${list(manifest.file_formats)}\n\n## Project / Technical Notes\n- Modules: ${manifest.project.modules}\n- Technical stack: ${manifest.project.technical_stack}\n- Source delivery: ${manifest.project.source_delivery}\n\n## Store / Marketplace Notes\n- Store platform: ${manifest.commerce.store_platform}\n- Store asset goal: ${manifest.commerce.store_asset_goal}\n- Connected store targets: ${manifest.commerce.connected_store_targets}\n- Selected product ID: ${manifest.commerce.selected_product_id || "Not selected"}\n- Selected product title: ${manifest.commerce.selected_product_title || "Not selected"}\n- Product description: ${manifest.commerce.product_description || "Not specified"}\n- Product tags: ${Array.isArray(manifest.commerce.product_tags) ? manifest.commerce.product_tags.join(", ") : "Not specified"}\n- Live upload payload: ${JSON.stringify(manifest.commerce.upload_payload)}\n\n## Social / Store Export-Ready Pack\n${list(manifest.social_store_export_pack.map((item: { label: string; format: string; guardrail: string }) => `${item.label}: ${item.format} — ${item.guardrail}`))}\n\n## Reference Link Safety\n${manifest.reference_link_safety}\n\n## How to Use\n1. Open the preview link from the dashboard.\n2. Download the delivery ZIP/source package.\n3. Read setup or platform notes before publishing.\n4. Use the revision area if any required item is missing or needs adjustment.\n\n## Dashboard Links\n- Preview: ${manifest.links.previewUrl}\n- Delivery ZIP: ${manifest.links.deliveryZipUrl}\n- Source files: ${manifest.links.sourceFilesUrl}\n- Manifest: ${manifest.links.deliveryLink}\n`;
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
    files.push({ path: "source/project-structure.md", purpose: "Delivered source structure and file map" });
    if (type === "mobile_app") {
      files.push({ path: "source/App.tsx", purpose: "Expo mobile app entry screen" });
      files.push({ path: "source/src/screens/HomeScreen.tsx", purpose: "Main mobile home screen" });
      files.push({ path: "source/src/screens/AdminScreen.tsx", purpose: "Mobile admin/control screen" });
      files.push({ path: "source/src/theme.ts", purpose: "Mobile app theme tokens" });
    }
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
  if (isSeoResearchDelivery(production)) {
    files.push({ path: "seo/keyword-opportunity-plan.md", purpose: "Keyword, SERP and content opportunity plan" });
    files.push({ path: "seo/competitor-analysis-brief.md", purpose: "Competitor positioning and public-source analysis brief" });
    files.push({ path: "seo/provider-research-map.json", purpose: "DataForSEO, Apify and Google Maps research input map" });
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
  return `# Project Structure\n\nProduction: ${manifest.title}\n\n## Delivered Package Layout\n\n\`\`\`text\ndelivery/\n├─ README.md\n├─ manifest.json\n├─ preview.html\n├─ source/\n│  ├─ app/page.tsx\n│  ├─ app/admin/page.tsx\n│  ├─ app/layout.tsx\n│  ├─ app/globals.css\n│  ├─ lib/config.ts\n│  └─ package.json\n├─ admin-panel/\n├─ docs/\n├─ media/\n├─ brand-kit/\n└─ documents/\n\`\`\`\n\n## Technical Stack\n${manifest.project.technical_stack}\n\n## Modules\n${manifest.project.modules}\n\n## Run Locally\n1. Open the source folder.\n2. Run npm install.\n3. Run npm run dev.\n4. Replace sample data/media with the customer's final assets.\n`;
}

function buildSourcePackageJson(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const safeName = manifest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "crelavo-project";
  if (manifest.production_type === "mobile_app") {
    return JSON.stringify({
      name: safeName,
      version: "0.1.0",
      private: true,
      main: "node_modules/expo/AppEntry.js",
      scripts: { start: "expo start", android: "expo start --android", ios: "expo start --ios", web: "expo start --web" },
      dependencies: { expo: "latest", react: "latest", "react-native": "latest", "expo-status-bar": "latest" },
      devDependencies: { typescript: "latest", "@types/react": "latest" }
    }, null, 2);
  }
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

function projectFeatureSet(production: ProductionLike) {
  const prompt = `${production.prompt ?? ""} ${production.title ?? ""} ${production.package_id ?? ""} ${production.production_type ?? ""}`.toLowerCase();
  const isMobile = String(production.production_type ?? "") === "mobile_app" || /mobile app|ios|android|expo|react native|uygulama|mobil/.test(prompt);
  const isStreaming = /movie|film|stream|netflix|watch|series|cinema/.test(prompt);
  const isCommerce = /shop|store|ecommerce|e-commerce|product|cart|checkout/.test(prompt);
  const isSaas = String(production.production_type ?? "") === "saas" || /saas|subscription|billing|workspace|dashboard|crm|portal/.test(prompt);
  if (isMobile) {
    return {
      vertical: "Mobile app",
      heroCta: "Open app preview",
      entities: ["Home screen", "Login flow", "User dashboard", "Push-ready structure", "Settings", "Admin/control screen"],
      cards: ["Welcome screen", "Main action", "Activity feed", "Profile"],
      adminRows: ["Users", "Screens", "Notifications", "Content", "App settings"]
    };
  }
  if (isStreaming) {
    return {
      vertical: "Streaming platform",
      heroCta: "Start watching",
      entities: ["Featured movies", "Categories", "Watch page", "User dashboard", "Admin movie manager", "Subscription plans"],
      cards: ["Midnight Signal", "Ocean Protocol", "City of Glass", "Northern Lights"],
      adminRows: ["Movies", "Users", "Plans", "Watch history", "Content moderation"]
    };
  }
  if (isCommerce) {
    return {
      vertical: "Commerce platform",
      heroCta: "Shop collection",
      entities: ["Storefront", "Product pages", "Cart", "Checkout", "Admin product manager", "Orders"],
      cards: ["Hero Product", "Best Seller", "Limited Offer", "Bundle Pack"],
      adminRows: ["Products", "Orders", "Customers", "Inventory", "Discounts"]
    };
  }
  if (isSaas) {
    return {
      vertical: "SaaS platform",
      heroCta: "Open dashboard",
      entities: ["Landing page", "Auth", "Workspace", "Billing", "Admin panel", "Settings"],
      cards: ["Analytics", "Automations", "Team seats", "Reports"],
      adminRows: ["Users", "Subscriptions", "Invoices", "Usage", "Support"]
    };
  }
  return {
    vertical: "Business website",
    heroCta: "Get started",
    entities: ["Homepage", "Service pages", "Lead form", "Pricing", "Dashboard", "Admin content manager"],
    cards: ["Core offer", "Client proof", "Pricing", "Contact"],
    adminRows: ["Leads", "Pages", "Testimonials", "Forms", "Settings"]
  };
}

function buildSourcePage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const featureSet = projectFeatureSet(production);
  const payload = JSON.stringify({
    title: manifest.title,
    brief: value(production.prompt, manifest.user_promise),
    standard: manifest.delivery_standard,
    modules: manifest.project.modules,
    stack: manifest.project.technical_stack,
    ...featureSet
  }, null, 2);
  return `const project = ${payload} as const;

export default function Page() {
  return (
    <main className="site-shell">
      <nav className="topbar">
        <strong>{project.title}</strong>
        <a href="#features">Features</a>
        <a href="#dashboard">Dashboard</a>
        <a href="/admin">Admin</a>
      </nav>
      <section className="hero-grid">
        <div>
          <span className="eyebrow">{project.vertical}</span>
          <h1>{project.title}</h1>
          <p>{project.brief}</p>
          <div className="hero-actions"><a className="primary" href="#features">{project.heroCta}</a><a className="secondary" href="/admin">Open admin</a></div>
        </div>
        <div className="preview-panel">
          <span>Live package</span>
          <strong>{project.standard}</strong>
          <p>{project.stack}</p>
        </div>
      </section>
      <section id="features" className="section">
        <div className="section-head"><span>Included modules</span><h2>Ready-to-customize product structure</h2></div>
        <div className="feature-grid">{project.entities.map((item) => <article key={item}><h3>{item}</h3><p>Included in the delivered source package and wired into the customer-facing flow.</p></article>)}</div>
      </section>
      <section className="section">
        <div className="section-head"><span>Content model</span><h2>Sample records</h2></div>
        <div className="content-row">{project.cards.map((item) => <article key={item}><div className="poster" /><h3>{item}</h3><p>Replace this sample with real customer data, media and copy.</p></article>)}</div>
      </section>
      <section id="dashboard" className="dashboard-card">
        <span>User dashboard</span>
        <h2>Account, subscription and activity area</h2>
        <p>{project.modules}</p>
      </section>
    </main>
  );
}
`;
}

function buildMobileTheme() {
  return `export const theme = {
  colors: {
    background: "#070b18",
    panel: "#111827",
    text: "#f8fbff",
    muted: "#aeb8cc",
    cyan: "#22d3ee",
    purple: "#7c5cff",
    green: "#22c55e"
  },
  radius: 22
} as const;
`;
}

function buildMobileHomeScreen(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const featureSet = projectFeatureSet(production);
  const payload = JSON.stringify({ title: manifest.title, brief: value(production.prompt, manifest.user_promise), features: featureSet.entities, cards: featureSet.cards }, null, 2);
  return `import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

const app = ${payload} as const;

export function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 22, gap: 18 }}>
      <View style={{ padding: 22, borderRadius: theme.radius, backgroundColor: theme.colors.panel }}>
        <Text style={{ color: theme.colors.cyan, fontWeight: "900", textTransform: "uppercase" }}>Mobile app preview</Text>
        <Text style={{ color: theme.colors.text, fontSize: 36, fontWeight: "900", marginTop: 10 }}>{app.title}</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 12, lineHeight: 22 }}>{app.brief}</Text>
        <TouchableOpacity style={{ marginTop: 18, backgroundColor: theme.colors.purple, padding: 14, borderRadius: 999 }}><Text style={{ color: "white", fontWeight: "900", textAlign: "center" }}>Get started</Text></TouchableOpacity>
      </View>
      {app.features.map((feature) => <View key={feature} style={{ padding: 18, borderRadius: 18, backgroundColor: "#0f172a" }}><Text style={{ color: theme.colors.text, fontWeight: "800", fontSize: 18 }}>{feature}</Text><Text style={{ color: theme.colors.muted, marginTop: 6 }}>Included in this delivered mobile app source package.</Text></View>)}
    </ScrollView>
  );
}
`;
}

function buildMobileAdminScreen(production: ProductionLike) {
  const rows = projectFeatureSet(production).adminRows;
  return `import { ScrollView, Text, View } from "react-native";
import { theme } from "../theme";

const rows = ${JSON.stringify(rows, null, 2)} as const;

export function AdminScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 22, gap: 12 }}>
      <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900" }}>Admin control</Text>
      {rows.map((row) => <View key={row} style={{ padding: 16, borderRadius: 16, backgroundColor: theme.colors.panel }}><Text style={{ color: theme.colors.text, fontWeight: "900" }}>{row}</Text><Text style={{ color: theme.colors.green, marginTop: 4 }}>Ready</Text></View>)}
    </ScrollView>
  );
}
`;
}

function buildMobileAppEntry() {
  return `import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "./src/screens/HomeScreen";

export default function App() {
  return <><HomeScreen /><StatusBar style="light" /></>;
}
`;
}

function buildSourceAdminPage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const featureSet = projectFeatureSet(production);
  const rows = featureSet.adminRows.map((row, index) => ({ name: row, status: index < 2 ? "Ready" : "Configured", count: 12 + index * 7 }));
  const payload = JSON.stringify({ title: manifest.title, rows, modules: manifest.project.modules }, null, 2);
  return `const admin = ${payload} as const;

export default function AdminPage() {
  return (
    <main className="site-shell admin-shell">
      <nav className="topbar"><strong>{admin.title} Admin</strong><a href="/">Back to site</a></nav>
      <section className="section-head admin-head"><span>Admin panel</span><h1>Manage content, users and delivery workflow</h1><p>{admin.modules}</p></section>
      <section className="admin-table">{admin.rows.map((row) => <article key={row.name}><strong>{row.name}</strong><span>{row.status}</span><small>{row.count} records</small></article>)}</section>
    </main>
  );
}
`;
}

function buildSourceCss() {
  return `:root { color-scheme: dark; font-family: Inter, Arial, sans-serif; background: #050816; color: #f8fbff; }
* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(circle at 10% 10%, rgba(34,211,238,.22), transparent 28rem), radial-gradient(circle at 90% 0%, rgba(124,92,255,.25), transparent 28rem), linear-gradient(135deg,#081226,#10172f 55%,#0b1020); }
a { color: inherit; text-decoration: none; }
.site-shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 56px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 0 28px; }
.topbar strong { font-size: 18px; }
.topbar a { color: #cbd5e1; font-weight: 700; }
.hero-grid { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(320px,.7fr); gap: 22px; align-items: stretch; }
.hero-grid > div, .section, .dashboard-card, .preview-panel, .admin-table article { border: 1px solid rgba(255,255,255,.14); background: rgba(15,23,42,.72); border-radius: 28px; box-shadow: 0 28px 80px rgba(0,0,0,.32); }
.hero-grid > div:first-child { padding: clamp(28px,5vw,58px); }
.eyebrow, .section-head span, .preview-panel span, .dashboard-card span, .admin-head span { color: #22d3ee; text-transform: uppercase; letter-spacing: .14em; font-size: 12px; font-weight: 900; }
h1 { font-size: clamp(42px, 7vw, 84px); line-height: .95; margin: 18px 0; letter-spacing: -0.06em; }
h2 { font-size: clamp(28px, 4vw, 46px); margin: 8px 0 16px; letter-spacing: -0.04em; }
h3 { margin: 0 0 8px; }
p { color: #cbd5e1; line-height: 1.75; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.primary, .secondary { border-radius: 999px; padding: 13px 18px; font-weight: 900; display: inline-flex; }
.primary { background: linear-gradient(135deg,#22d3ee,#7c5cff); color: white; }
.secondary { border: 1px solid rgba(255,255,255,.18); color: #dbeafe; }
.preview-panel { padding: 26px; display: flex; flex-direction: column; justify-content: center; }
.preview-panel strong { font-size: 28px; margin: 12px 0; }
.section, .dashboard-card { margin-top: 22px; padding: 28px; }
.feature-grid, .content-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(190px,1fr)); gap: 14px; }
.feature-grid article, .content-row article { border: 1px solid rgba(255,255,255,.1); background: rgba(2,6,23,.45); border-radius: 22px; padding: 18px; }
.poster { height: 150px; border-radius: 18px; margin-bottom: 14px; background: linear-gradient(135deg, rgba(34,211,238,.3), rgba(124,92,255,.45)), radial-gradient(circle at 50% 20%, #fff3, transparent 40%); }
.dashboard-card { background: linear-gradient(135deg, rgba(34,211,238,.16), rgba(124,92,255,.18)); }
.admin-head { padding: 30px; border: 1px solid rgba(255,255,255,.14); background: rgba(15,23,42,.72); border-radius: 28px; }
.admin-table { display: grid; gap: 12px; margin-top: 18px; }
.admin-table article { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 16px 18px; }
.admin-table span { color: #22c55e; font-weight: 900; }
.admin-table small { color: #93c5fd; }
@media (max-width: 820px) { .hero-grid { grid-template-columns: 1fr; } .topbar { align-items: flex-start; flex-direction: column; } .admin-table article { grid-template-columns: 1fr; } }
`;
}

function buildWebsiteAdminHtml(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${manifest.title} Admin</title><link rel="stylesheet" href="./styles.css"></head><body><main><p class="eyebrow">Admin starter</p><h1>${manifest.title} Admin</h1><p>This is a demo auth starter. Configure production authentication, authorization and server-side sessions before deployment.</p><section class="admin-grid"><article><h2>Content</h2><p>Review and update published sections.</p></article><article><h2>Leads</h2><p>Review contact form submissions.</p></article><article><h2>Analytics</h2><p>Connect approved analytics and monitor conversion events.</p></article></section><p class="notice">Demo auth only. Never put Crelavo secrets in browser source.</p></main><script src="./script.js"></script></body></html>`;
}

function buildWebsiteAdminCss() {
  return `:root{font-family:Inter,system-ui,sans-serif;color:#f8fafc;background:#091126}body{margin:0;background:radial-gradient(circle at 10% 0%,#3158aa55,transparent 30rem)}main{width:min(1080px,calc(100% - 2rem));margin:auto;padding:4rem 0}.admin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.admin-grid article,.notice{padding:1.5rem;border:1px solid #ffffff2b;border-radius:1rem;background:#16213dcc;box-shadow:0 18px 45px #0005}.eyebrow{color:#7dd3fc;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.notice{margin-top:1rem;color:#fde68a}@media(max-width:760px){.admin-grid{grid-template-columns:1fr}}`;
}

function buildWebsiteAdminJs() {
  return `document.dispatchEvent(new CustomEvent("admin-starter-ready"));`;
}

function buildAdminRequirements(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Admin Panel Requirements\n\nProduction: ${manifest.title}\n\n## Required Admin Scope\n- Content management\n- User/request management\n- Delivery file management\n- Status updates\n- Revision handling\n\n## Project Modules\n${manifest.project.modules}\n\n## Notes\nAdmin screens must match the selected production scope and should be included in the final source or delivery guide when requested.\n`;
}

function buildDeploymentGuide(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Deployment Guide\n\nProduction: ${manifest.title}\n\n## Before Deploying\n- Review README.md and manifest.json.\n- Replace placeholders with verified business data.\n- Confirm all requested delivery requirements are present.\n\n## Suggested Stack\n${manifest.project.technical_stack}\n\n## Delivery Links\n- Preview: ${manifest.links.previewUrl}\n- ZIP: ${manifest.links.deliveryZipUrl}\n- Source guide: ${manifest.links.sourceFilesUrl}\n`;
}

function buildVideoProductionPackage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Video Production Package\n\nProduction: ${manifest.title}\n\n## User Request\n${value(production.prompt, manifest.user_promise)}\n\n## Deliverable\nThis package contains the production-ready video brief, scene list, caption pack, export specs and provider handoff data. If a connected video provider is available, the final MP4 URL is attached to the production record. If no provider is connected, this package is the ready-to-run handoff for the video provider/admin renderer.\n\n## Scenes\n1. Hook opening\n2. Main value demonstration\n3. Feature/proof section\n4. CTA / closing frame\n\n## Export Specs\n- Format: MP4\n- Social variants: 9:16, 1:1, 16:9 when requested\n- Captions: included as editable copy in captions.srt\n- Revision target: hook, CTA, subtitle style, music direction\n`;
}

function buildCaptionsSrt(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const text = value(production.prompt, manifest.title).replace(/\s+/g, " ").slice(0, 120);
  return `1\n00:00:00,000 --> 00:00:03,000\n${manifest.title}\n\n2\n00:00:03,000 --> 00:00:08,000\n${text}\n\n3\n00:00:08,000 --> 00:00:12,000\nCreated with Crelavo production delivery.\n`;
}

function buildImageAssetPack(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Image Asset Pack\n\nProduction: ${manifest.title}\n\n## User Request\n${value(production.prompt, manifest.user_promise)}\n\n## Included\n- image-brief.md\n- prompts/final-prompt.txt\n- export-specs.md\n- usage-rights.md\n\n## Export Specs\nPNG/JPG delivery should be attached when the image provider returns final files. This package stores the exact creative brief, prompt and export standard so the image can be regenerated or revised.\n`;
}

function buildVoiceScriptPackage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Voice Production Package\n\nProduction: ${manifest.title}\n\n## Script\n${value(production.prompt, "Voice-over script prepared from the user request.")}\n\n## Delivery\n- voice-script.md\n- pronunciation-notes.md\n- voice-settings.json\n- usage-rights.md\n\n## Output Standard\nFinal audio should be delivered as MP3/WAV when the voice provider is connected. This package keeps the script and voice direction ready for rendering and revision.\n`;
}

function buildSeoContentPack(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# SEO Content Pack\n\nProduction: ${manifest.title}\n\n## Brief\n${value(production.prompt, manifest.user_promise)}\n\n## Deliverables\n- metadata.md\n- content-outline.md\n- keywords.csv\n- page-copy.md\n- implementation-checklist.md\n\n## Metadata Draft\nTitle: ${manifest.title}\nDescription: ${value(production.prompt, manifest.user_promise).slice(0, 155)}\n`;
}

function buildEcommerceStorefront(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `export default function StorefrontPage() {\n  const products = [\"Hero Product\", \"Best Seller\", \"Bundle Offer\", \"Limited Drop\"];\n  return (\n    <main className=\"site-shell\">\n      <section className=\"hero-grid\"><div><span className=\"eyebrow\">E-commerce storefront</span><h1>${manifest.title}</h1><p>${value(production.prompt, manifest.user_promise)}</p></div></section>\n      <section className=\"section\"><h2>Products</h2><div className=\"feature-grid\">{products.map((product) => <article key={product}><h3>{product}</h3><p>Catalog, cart and checkout-ready product slot.</p></article>)}</div></section>\n    </main>\n  );\n}\n`;
}

function buildSaasDashboard(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `export default function DashboardPage() {\n  const widgets = [\"Analytics\", \"Users\", \"Billing\", \"Automations\", \"Reports\"];\n  return (\n    <main className=\"site-shell\">\n      <section className=\"dashboard-card\"><span>SaaS dashboard</span><h1>${manifest.title}</h1><p>${value(production.prompt, manifest.user_promise)}</p></section>\n      <section className=\"feature-grid\">{widgets.map((widget) => <article key={widget}><h3>{widget}</h3><p>Ready dashboard module.</p></article>)}</section>\n    </main>\n  );\n}\n`;
}

function buildAdminCrudPage(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `export default function AdminCrudPage() {\n  const tables = [\"Users\", \"Records\", \"Roles\", \"Settings\", \"Activity\"];\n  return (\n    <main className=\"site-shell\">\n      <section className=\"admin-head\"><span>Admin panel</span><h1>${manifest.title}</h1><p>${value(production.prompt, manifest.user_promise)}</p></section>\n      <section className=\"admin-table\">{tables.map((table) => <article key={table}><strong>{table}</strong><span>CRUD ready</span><small>Role controlled</small></article>)}</section>\n    </main>\n  );\n}\n`;
}

function buildSubtitlesTemplate() {
  return `1\n00:00:00,000 --> 00:00:03,000\nReplace with final subtitle line.\n\n2\n00:00:03,000 --> 00:00:06,000\nReplace with final subtitle line.\n`;
}

function buildThumbnailBrief(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  const coverPrompt = `Cinematic vertical 9:16 cover image for ${manifest.title}. One strong focal subject, high contrast lighting, dark background, glowing red and electric blue accents, urgent FOMO-driven atmosphere, premium social media hook, no text, no logos, no extra people, no clutter, clean composition.`;
  return `# Thumbnail Brief\n\nProduction: ${manifest.title}\n\nCreate or upload a thumbnail matching the final output, platform and campaign goal.\n\n## Thumbnail prompt\n${coverPrompt}\n`;
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

function isSeoResearchDelivery(production: ProductionLike) {
  const textBlock = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.features ?? ""} ${production.target_platform ?? ""} ${production.prompt ?? ""}`.toLowerCase();
  return /seo|serp|keyword|dataforseo|apify|google maps|google business|local search|competitor analysis|competitor research|rakip|rakip analiz|search ranking|organic traffic|growth intelligence/.test(textBlock);
}

function buildKeywordOpportunityPlan(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Keyword Opportunity Plan\n\nProduction: ${manifest.title}\n\n## Research Inputs\n- Primary market: ${manifest.commerce.connected_store_targets}\n- Product / offer context: ${value(production.prompt, "Use the customer brief and target market.")}\n- Data source: DataForSEO keyword volume and live SERP checks when credentials are configured.\n\n## Output Structure\n- Core buying-intent keywords.\n- Comparison and alternative keywords.\n- Problem/search-intent keywords.\n- Content page ideas, title angles and CTA route.\n\n## Guardrail\nUse public keyword/SERP signals only. Do not claim rankings, traffic or competitor data that has not been verified by a live provider check.\n`;
}

function buildCompetitorAnalysisBrief(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return `# Competitor Analysis Brief\n\nProduction: ${manifest.title}\n\n## Public Sources To Review\n- Competitor home, pricing, feature and comparison pages.\n- Public ads, social posts, reviews and marketplace listings.\n- Search result structure and visible SERP features.\n\n## Analysis Sections\n- Positioning: what each competitor promises.\n- Offer gaps: pricing, proof, delivery speed, vertical focus.\n- SEO gaps: missing page types, weak title angles, unanswered buyer questions.\n- Response plan: original Crelavo page/ad/content ideas that do not copy protected assets.\n\n## Guardrail\nExtract structure and market signals only. Never reuse competitor copy, brand assets, private data, scraped restricted pages or unverifiable claims.\n`;
}

function buildProviderResearchMap(production: ProductionLike) {
  const manifest = buildDeliveryManifest(production);
  return JSON.stringify({
    production_id: manifest.production_id,
    title: manifest.title,
    providers: {
      dataforseo: {
        use: ["keyword_volume", "live_serp", "competitor_serp_context"],
        env_gate: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"]
      },
      apify: {
        use: ["public_page_extraction", "allowed_public_source_monitoring", "dataset_items"],
        env_gate: ["APIFY_API_TOKEN"]
      },
      google_maps: {
        use: ["local_seo", "place_search", "regional_competitor_context"],
        env_gate: ["GOOGLE_MAPS_API_KEY"]
      }
    },
    approval_rules: ["public sources only", "no restricted-page bypass", "no protected copy reuse", "admin review before final report claims"]
  }, null, 2);
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
  const generatedWebsiteFiles = Array.isArray(production.output_json?.websiteFiles) ? production.output_json.websiteFiles : [];
  for (const file of generatedWebsiteFiles) {
    const path = file && typeof file === "object" && typeof file.path === "string" ? file.path : "";
    const segments = path.split("/");
    if (file && typeof file === "object" && typeof file.content === "string" && /^(index\.html|styles\.css|script\.js|README\.md|\.env\.example|admin\/(index\.html|styles\.css|script\.js|env\.example)|data\/(schema\.json|data\.json)|src\/[a-zA-Z0-9._/-]+\.(tsx|ts|css|js|json|md))$/.test(path) && segments.every((segment: string) => segment && segment !== "." && segment !== "..") && !path.startsWith("/") && !path.includes("\\")) entries.push({ name: `source/${path}`, content: file.content });
  }
  if (manifest.scope === "website_with_admin" && manifest.production_type === "website") {
    const sourceNames = new Set(entries.map((entry) => entry.name));
    const add = (name: string, content: string) => { if (!sourceNames.has(name)) entries.push({ name, content }); };
    add("source/admin/index.html", buildWebsiteAdminHtml(production));
    add("source/admin/styles.css", buildWebsiteAdminCss());
    add("source/admin/script.js", buildWebsiteAdminJs());
    add("source/.env.example", "PUBLIC_SITE_URL=http://localhost:3000\\nADMIN_AUTH_PROVIDER=replace-with-production-provider\\n");
    add("source/data/schema.json", JSON.stringify({ version: 1, entities: [{ name: "leads", fields: ["id", "name", "email", "message", "created_at"] }, { name: "content", fields: ["id", "section_id", "title", "body", "updated_at"] }], auth: { mode: "demo", productionNote: "Configure production authentication and authorization before deployment." } }, null, 2));
  }
  if (requirements.wantsSourceCode || ["website", "saas", "mobile_app", "admin_project"].includes(manifest.production_type)) {
    entries.push({ name: "source/project-structure.md", content: buildProjectStructure(production) });
    entries.push({ name: "source/package.json", content: buildSourcePackageJson(production) });
    if (manifest.production_type === "mobile_app") {
      entries.push({ name: "source/App.tsx", content: buildMobileAppEntry() });
      entries.push({ name: "source/src/screens/HomeScreen.tsx", content: buildMobileHomeScreen(production) });
      entries.push({ name: "source/src/screens/AdminScreen.tsx", content: buildMobileAdminScreen(production) });
      entries.push({ name: "source/src/theme.ts", content: buildMobileTheme() });
    } else {
      entries.push({ name: "source/app/layout.tsx", content: buildSourceLayout(production) });
      entries.push({ name: "source/app/page.tsx", content: buildSourcePage(production) });
      entries.push({ name: "source/app/admin/page.tsx", content: buildSourceAdminPage(production) });
      entries.push({ name: "source/app/globals.css", content: buildSourceCss() });
      entries.push({ name: "source/lib/config.ts", content: buildSourceConfig(production) });
    }
  }
if (manifest.delivery_standard === "commerce_export" || manifest.production_type === "campaign") {
  entries.push({ name: "campaign/copy-pack.md", content: buildCampaignCopyPack(production) });
  entries.push({ name: "campaign/social-export-plan.md", content: buildSocialExportPlan(production) });
}
if (manifest.delivery_standard === "commerce_export" || manifest.production_type === "campaign") {
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
if (isSeoResearchDelivery(production)) {
  entries.push({ name: "seo/keyword-opportunity-plan.md", content: buildKeywordOpportunityPlan(production) });
  entries.push({ name: "seo/competitor-analysis-brief.md", content: buildCompetitorAnalysisBrief(production) });
  entries.push({ name: "seo/provider-research-map.json", content: buildProviderResearchMap(production) });
}
if (requirements.wantsAdminPanel) entries.push({ name: "admin-panel/admin-requirements.md", content: buildAdminRequirements(production) });
if (requirements.wantsDeploymentGuide) entries.push({ name: "docs/deployment-guide.md", content: buildDeploymentGuide(production) });
if (["ecommerce", "campaign"].includes(manifest.production_type) || /ecommerce|store|shop|commerce|product/.test(`${manifest.package_id} ${production.prompt ?? ""}`.toLowerCase())) {
  entries.push({ name: "source/app/store/page.tsx", content: buildEcommerceStorefront(production) });
  entries.push({ name: "ecommerce/catalog-schema.json", content: JSON.stringify({ products: ["Hero Product", "Best Seller", "Bundle Offer"], checkout: "ready", admin: "ready" }, null, 2) });
}
if (manifest.production_type === "saas") {
  entries.push({ name: "source/app/dashboard/page.tsx", content: buildSaasDashboard(production) });
  entries.push({ name: "source/app/billing/page.tsx", content: buildSaasDashboard(production) });
  entries.push({ name: "database/schema.sql", content: "create table users (id uuid primary key, email text, created_at timestamptz default now());\ncreate table subscriptions (id uuid primary key, user_id uuid, status text);\n" });
}
if (manifest.production_type === "admin_project") {
  entries.push({ name: "source/app/admin/records/page.tsx", content: buildAdminCrudPage(production) });
  entries.push({ name: "database/admin-schema.sql", content: "create table admin_records (id uuid primary key, title text, status text, created_at timestamptz default now());\n" });
}
if (["video", "talking_video", "avatar", "lip_sync", "drama", "documentary", "drone_video"].includes(manifest.production_type) || requirements.wantsFinalVideo) {
  entries.push({ name: "video/video-production-package.md", content: buildVideoProductionPackage(production) });
  entries.push({ name: "video/captions.srt", content: buildCaptionsSrt(production) });
  entries.push({ name: "video/export-specs.json", content: JSON.stringify({ format: "mp4", variants: ["9:16", "1:1", "16:9"], status: "provider_ready" }, null, 2) });
}
if (["image", "brand_kit"].includes(manifest.production_type)) {
  entries.push({ name: "image/image-asset-pack.md", content: buildImageAssetPack(production) });
  entries.push({ name: "image/prompts/final-prompt.txt", content: value(production.prompt, manifest.title) });
  entries.push({ name: "image/export-specs.json", content: JSON.stringify({ formats: ["png", "jpg"], status: "provider_ready" }, null, 2) });
}
if (["voice", "voice_clone", "dubbing"].includes(manifest.production_type)) {
  entries.push({ name: "voice/voice-production-package.md", content: buildVoiceScriptPackage(production) });
  entries.push({ name: "voice/voice-settings.json", content: JSON.stringify({ format: "mp3/wav", language: "auto", status: "provider_ready" }, null, 2) });
}
if (["seo", "document", "localization"].includes(manifest.production_type) || /seo|content|document|growth/.test(`${manifest.package_id} ${production.prompt ?? ""}`.toLowerCase())) {
  entries.push({ name: "seo/seo-content-pack.md", content: buildSeoContentPack(production) });
  entries.push({ name: "seo/keywords.csv", content: "keyword,intent,priority\nprimary keyword,commercial,high\nsecondary keyword,informational,medium\n" });
}
if (requirements.wantsSubtitles) entries.push({ name: "media/subtitles-template.srt", content: buildSubtitlesTemplate() });
  if (requirements.wantsThumbnail) entries.push({ name: "media/thumbnail-brief.md", content: buildThumbnailBrief(production) });
  if (requirements.wantsPdf) entries.push({ name: "documents/final-document.md", content: buildDocumentSource(production) });
  if (requirements.wantsBrandKit) entries.push({ name: "brand-kit/brand-guide.md", content: buildBrandGuide(production) });
  if (requirements.wantsZip) entries.push({ name: "delivery-package-notes.md", content: buildZipNotes(production) });
  return entries;
}

function buildSaaSPreviewHtml(production: ProductionLike) {
  const title = escapeHtml(value(production.title, "TaskFlow AI"));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#eef4ff;background:#070b18}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 10% 0,#1b4d8060,transparent 34rem),#070b18}.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}.side{padding:24px 16px;border-right:1px solid #ffffff18;background:#0a1020}.brand{font-weight:900;font-size:20px;margin-bottom:28px}.side button{display:block;width:100%;text-align:left;border:0;background:none;color:#aab8d2;padding:12px;border-radius:10px;cursor:pointer}.side button.active,.side button:hover{background:#1b2a4d;color:#fff}.main{padding:30px;max-width:1300px;width:100%;margin:auto}.top{display:flex;justify-content:space-between;gap:20px;align-items:center}.eyebrow{color:#5ee7ff;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:900}.muted{color:#9aa9c4}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:26px 0}.card{border:1px solid #ffffff18;background:#101a31cc;border-radius:16px;padding:20px;box-shadow:0 18px 45px #0004}.card strong{display:block;font-size:25px;margin-top:8px}.section{display:none}.section.active{display:block}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:30px 0 14px}.btn{border:0;border-radius:999px;padding:11px 16px;background:linear-gradient(135deg,#45defc,#8067ff);color:#fff;font-weight:800;cursor:pointer}.list{display:grid;gap:10px}.row{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px;border-bottom:1px solid #ffffff12}.badge{padding:5px 9px;border-radius:999px;background:#173d43;color:#8ff5d2;font-size:12px}.form{display:grid;gap:12px;max-width:620px}.form input,.form textarea{width:100%;padding:12px;border-radius:10px;border:1px solid #ffffff20;background:#0b1327;color:#fff}.modal{position:fixed;inset:0;display:none;place-items:center;background:#020611aa}.modal.open{display:grid}.modal .card{width:min(560px,calc(100% - 32px))}@media(max-width:800px){.app{grid-template-columns:1fr}.side{position:static;border-right:0;border-bottom:1px solid #ffffff18}.side nav{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.main{padding:20px}.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.grid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}}</style></head><body><div class="app"><aside class="side"><div class="brand">${title}</div><nav><button class="active" data-section="dashboard">Dashboard</button><button data-section="projects">Projects</button><button data-section="tasks">Tasks</button><button data-section="team">Team</button><button data-section="analytics">Analytics</button><button data-section="billing">Billing</button><button data-section="settings">Settings</button><button data-section="admin">Admin</button></nav></aside><main class="main"><section class="section active" id="dashboard"><div class="top"><div><span class="eyebrow">Workspace overview</span><h1>Good morning</h1><p class="muted">Manage your projects, tasks and team from one workspace.</p></div><button class="btn" data-open="project-modal">Create project</button></div><div class="grid"><div class="card"><span class="muted">Active projects</span><strong>12</strong></div><div class="card"><span class="muted">Tasks due today</span><strong>24</strong></div><div class="card"><span class="muted">Completed tasks</span><strong>86</strong></div><div class="card"><span class="muted">Team workload</span><strong>72%</strong></div></div><div class="card"><span class="eyebrow">Recent activity</span><div class="list"><div class="row"><span>Website redesign approved</span><span class="badge">Completed</span></div><div class="row"><span>Mobile onboarding needs review</span><span class="badge">In progress</span></div><div class="row"><span>Billing integration task assigned</span><span class="badge">Assigned</span></div></div></div></section><section class="section" id="projects"><div class="toolbar"><div><span class="eyebrow">Workspace</span><h1>Projects</h1></div><button class="btn" data-open="project-modal">Create project</button></div><div class="list card"><div class="row"><span>Website redesign</span><span class="badge">In progress</span></div><div class="row"><span>Customer portal</span><span class="badge">Planning</span></div><div class="row"><span>Mobile onboarding</span><span class="badge">Review</span></div></div></section><section class="section" id="tasks"><div class="toolbar"><div><span class="eyebrow">Workspace</span><h1>Tasks</h1></div><button class="btn" data-open="task-modal">Create task</button></div><div class="list card"><div class="row"><span>Define onboarding flow</span><span class="badge">High priority</span></div><div class="row"><span>Review billing settings</span><span class="badge">Due today</span></div><div class="row"><span>Invite new team member</span><span class="badge">Open</span></div></div></section><section class="section" id="team"><div class="toolbar"><div><span class="eyebrow">Workspace</span><h1>Team</h1></div><button class="btn">Invite member</button></div><div class="list card"><div class="row"><span>Alex Morgan · Owner</span><span class="badge">Active</span></div><div class="row"><span>Sam Lee · Admin</span><span class="badge">Active</span></div><div class="row"><span>Jordan Kim · Member</span><span class="badge">Active</span></div></div></section><section class="section" id="analytics"><div class="toolbar"><div><span class="eyebrow">Insights</span><h1>Analytics</h1></div></div><div class="grid"><div class="card"><span class="muted">Project completion</span><strong>68%</strong></div><div class="card"><span class="muted">On-time delivery</span><strong>91%</strong></div><div class="card"><span class="muted">Weekly output</span><strong>148</strong></div><div class="card"><span class="muted">Overdue tasks</span><strong>7</strong></div></div></section><section class="section" id="billing"><div class="toolbar"><div><span class="eyebrow">Workspace</span><h1>Billing</h1></div><button class="btn">Upgrade plan</button></div><div class="card"><h2>Team plan</h2><p class="muted">Demo billing state. Connect your secure billing provider before production.</p><div class="row"><span>Monthly usage</span><span>68 / 100 seats</span></div><div class="row"><span>Next billing date</span><span>Not connected</span></div></div></section><section class="section" id="settings"><div class="toolbar"><div><span class="eyebrow">Workspace</span><h1>Settings</h1></div></div><div class="card form"><label>Workspace name<input value="${title}" /></label><label>Default language<input value="English" /></label><label>Time zone<input value="Europe/Amsterdam" /></label><button class="btn">Save settings</button></div></section><section class="section" id="admin"><div class="toolbar"><div><span class="eyebrow">Administrator</span><h1>Admin dashboard</h1></div></div><div class="grid"><div class="card"><span class="muted">Users</span><strong>24</strong></div><div class="card"><span class="muted">Workspaces</span><strong>8</strong></div><div class="card"><span class="muted">Usage</span><strong>74%</strong></div><div class="card"><span class="muted">System status</span><strong>Ready</strong></div></div></section></main></div><div class="modal" id="project-modal"><div class="card form"><h2>Create project</h2><input placeholder="Project name" /><textarea placeholder="What are you building?"></textarea><button class="btn" data-close="project-modal">Create project</button></div></div><div class="modal" id="task-modal"><div class="card form"><h2>Create task</h2><input placeholder="Task name" /><textarea placeholder="Task description"></textarea><button class="btn" data-close="task-modal">Create task</button></div></div><script>document.querySelectorAll("[data-section]").forEach((button)=>button.addEventListener("click",()=>{document.querySelectorAll(".section").forEach((section)=>section.classList.toggle("active",section.id===button.dataset.section));document.querySelectorAll("[data-section]").forEach((item)=>item.classList.toggle("active",item===button));}));document.addEventListener("click",(event)=>{const target=event.target.closest("[data-open]");if(target){event.preventDefault();document.getElementById(target.dataset.open)?.classList.add("open");}const closeTarget=event.target.closest("[data-close]");if(closeTarget){event.preventDefault();document.getElementById(closeTarget.dataset.close)?.classList.remove("open");}});document.querySelectorAll(".modal").forEach((modal)=>modal.addEventListener("click",(event)=>{if(event.target===modal)modal.classList.remove("open");}));</script></body></html>`;
}

function buildEcommercePreviewHtml(production: ProductionLike) {
  const title = escapeHtml(value(production.title, "Crelavo Store"));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#f8fbff;background:#080b18}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 10% 0,#24577a66,transparent 32rem),#080b18}.shell{max-width:1180px;margin:auto;padding:28px 20px}.nav,.hero,.row{display:flex;justify-content:space-between;align-items:center;gap:18px}.nav{padding-bottom:28px}.brand{font-size:22px;font-weight:900}.links{display:flex;gap:18px}.links a{color:#aebbd1}.hero{align-items:stretch}.panel,.product,.summary{border:1px solid #ffffff22;background:#101a31d9;border-radius:22px;padding:24px;box-shadow:0 22px 60px #0005}.hero>div{flex:1}.hero h1{font-size:clamp(38px,6vw,72px);line-height:.98;margin:16px 0}.muted{color:#aab7ce;line-height:1.6}.visual{min-height:280px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(135deg,#2785a888,#7659c888);font-size:25px;font-weight:900}.btn{border:0;border-radius:999px;padding:12px 17px;background:linear-gradient(135deg,#4ee5ff,#8468ff);color:#fff;font-weight:800;cursor:pointer}.section{margin-top:34px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.price{font-size:20px;font-weight:900;margin:15px 0}.summary{margin-top:15px}.row{padding:13px 0;border-bottom:1px solid #ffffff16}.form{display:grid;gap:10px}.form input{padding:12px;border:1px solid #ffffff20;border-radius:10px;background:#0c1427;color:#fff}@media(max-width:720px){.hero{display:grid}.links{display:none}.grid{grid-template-columns:1fr}}</style></head><body><main class="shell"><nav class="nav"><strong class="brand">${title}</strong><div class="links"><a href="#shop">Shop</a><a href="#orders">Orders</a><a href="#admin">Admin</a></div><button class="btn" onclick="document.getElementById('cart').scrollIntoView({behavior:'smooth'})">Cart (<span id="count">0</span>)</button></nav><section class="hero"><div><span class="muted">Online storefront</span><h1>Everything your store needs to sell online.</h1><p class="muted">Browse products, review product details, add items to cart and continue through checkout.</p><button class="btn" onclick="document.getElementById('shop').scrollIntoView({behavior:'smooth'})">Shop products</button></div><div class="panel"><div class="visual">Featured product</div></div></section><section class="section" id="shop"><h2>Product catalog</h2><div class="grid"><article class="product"><div class="visual">Product 01</div><h3>Everyday Essential</h3><p class="muted">Product detail and purchase action.</p><div class="price">€49.00</div><button class="btn" data-add>Add to cart</button></article><article class="product"><div class="visual">Product 02</div><h3>Signature Collection</h3><p class="muted">Clear value, pricing and action.</p><div class="price">€79.00</div><button class="btn" data-add>Add to cart</button></article><article class="product"><div class="visual">Product 03</div><h3>Starter Bundle</h3><p class="muted">Bundle card ready for real catalog data.</p><div class="price">€99.00</div><button class="btn" data-add>Add to cart</button></article></div></section><section class="section" id="cart"><div class="summary"><h2>Cart & checkout</h2><div class="row"><span>Items in cart</span><strong id="cart-items">0</strong></div><div class="row"><span>Subtotal</span><strong id="total">€0.00</strong></div><form class="form" id="checkout"><input placeholder="Full name" required><input type="email" placeholder="Email address" required><input placeholder="Shipping address" required><button class="btn">Place demo order</button><small class="muted" id="note">Demo checkout. Connect a secure payment provider before production.</small></form></div></section><section class="section" id="orders"><h2>Orders</h2><div class="summary"><div class="row"><span>Order management</span><span class="muted">Ready for secure backend connection</span></div></div></section><section class="section" id="admin"><h2>Admin product manager</h2><div class="summary"><div class="row"><span>Product catalog</span><span>Published</span></div><div class="row"><span>Inventory</span><span>Ready for connection</span></div><div class="row"><span>Orders</span><span>Admin workflow included</span></div></div></section></main><script>let count=0,total=0;document.querySelectorAll("[data-add]").forEach((button)=>button.addEventListener("click",()=>{count+=1;total+=49;document.getElementById("count").textContent=String(count);document.getElementById("cart-items").textContent=String(count);document.getElementById("total").textContent="€"+total.toFixed(2);}));document.getElementById("checkout").addEventListener("submit",(event)=>{event.preventDefault();document.getElementById("note").textContent="Demo order captured. Connect a secure order endpoint before production.";});</script></body></html>`;
}

export function buildPreviewHtml(production: ProductionLike) {
  if (production.production_type === "saas") return buildSaaSPreviewHtml(production);
  if (production.production_type === "website" && /ecommerce|shopify|woocommerce|store/i.test(String(production.package_id ?? ""))) return buildEcommercePreviewHtml(production);
  const generatedWebsiteFiles = Array.isArray(production.output_json?.websiteFiles) ? production.output_json.websiteFiles : [];
  if (generatedWebsiteFiles.length && production.production_type === "website") {
    const index = generatedWebsiteFiles.find((file) => file && typeof file === "object" && file.path === "index.html") as Record<string, unknown> | undefined;
    const css = generatedWebsiteFiles.find((file) => file && typeof file === "object" && file.path === "styles.css") as Record<string, unknown> | undefined;
    const js = generatedWebsiteFiles.find((file) => file && typeof file === "object" && file.path === "script.js") as Record<string, unknown> | undefined;
    if (index && typeof index.content === "string") return index.content.replace(/<link[^>]+href=[\"']styles\.css[\"'][^>]*>/i, `<style>${String(css?.content ?? "")}</style>`).replace(/<script[^>]+src=[\"']script\.js[\"'][^>]*><\/script>/i, `<script>${String(js?.content ?? "")}</script>`);
  }
  const manifest = buildDeliveryManifest(production);
  const featureSet = projectFeatureSet(production);
  const modules = featureSet.entities.map((item) => `<article><h3>${item}</h3><p>Included in the delivered project package.</p></article>`).join("");
  const cards = featureSet.cards.map((item) => `<article><div></div><h3>${item}</h3><p>Sample data slot ready for customer content.</p></article>`).join("");
  const mobileClass = manifest.production_type === "mobile_app" ? " mobile-preview" : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${manifest.title}</title><style>body{font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 10% 10%,#22d3ee38,transparent 28rem),radial-gradient(circle at 90% 0,#7c5cff42,transparent 28rem),linear-gradient(135deg,#081226,#10172f 55%,#0b1020);color:#f8fbff;margin:0}main{width:min(1120px,calc(100% - 32px));margin:auto;padding:32px 0 56px}.top{display:flex;justify-content:space-between;gap:16px;align-items:center}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:20px;margin-top:28px}.mobile-preview .hero{grid-template-columns:minmax(0,1fr) minmax(280px,380px)}.mobile-preview .panel{border-radius:42px;min-height:520px;background:linear-gradient(180deg,#111827,#020617);border:10px solid #030712}.panel,.hero>div,article{border:1px solid #ffffff24;background:#0f172ab8;border-radius:28px;padding:26px;box-shadow:0 28px 80px #0007}.eyebrow{color:#22d3ee;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:900}h1{font-size:clamp(42px,7vw,78px);line-height:.95;margin:18px 0;letter-spacing:-.06em}p{color:#cbd5e1;line-height:1.7}.btn{display:inline-flex;margin-top:18px;border-radius:999px;padding:13px 18px;font-weight:900;background:linear-gradient(135deg,#22d3ee,#7c5cff)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:18px}.poster{height:120px;border-radius:18px;background:linear-gradient(135deg,#22d3ee55,#7c5cff77)}section{margin-top:24px}@media(max-width:820px){.hero{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}}</style></head><body><main class="${mobileClass.trim()}"><div class="top"><strong>${manifest.title}</strong><span class="eyebrow">${featureSet.vertical}</span></div><section class="hero"><div><span class="eyebrow">Customer preview</span><h1>${manifest.title}</h1><p>${value(production.prompt, manifest.user_promise)}</p><span class="btn">${featureSet.heroCta}</span></div><div class="panel"><span class="eyebrow">Delivered source</span><h2>${manifest.delivery_standard}</h2><p>${manifest.project.technical_stack}</p></div></section><section><span class="eyebrow">Included modules</span><div class="grid">${modules}</div></section><section><span class="eyebrow">Sample content</span><div class="grid">${cards}</div></section></main></body></html>`;
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

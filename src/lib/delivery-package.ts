export type DeliveryPackage = {
  productionType: string;
  standard: "media_final" | "project_source" | "commerce_export" | "brand_asset" | "document_package";
  userPromise: string;
  requiredItems: string[];
  optionalItems: string[];
  dashboardFields: string[];
  adminChecklist: string[];
  fileFormats: string[];
  costCredits: number;
  costNote: string;
};

const PROJECT_TYPES = new Set(["website", "saas", "mobile_app", "admin_project"]);
const BRAND_TYPES = new Set(["brand_kit", "image"]);
const DOCUMENT_TYPES = new Set(["document_pack"]);

export function isProjectDeliveryType(productionType: string) {
  return PROJECT_TYPES.has(productionType) || BRAND_TYPES.has(productionType) || DOCUMENT_TYPES.has(productionType) || productionType === "campaign";
}

export function deliveryPackageForProduction(input: { productionType: string; packageId?: string; features?: string | string[]; storePlatform?: string; sourceDelivery?: string }): DeliveryPackage {
  const productionType = String(input.productionType ?? "general");
  const packageId = String(input.packageId ?? "");
  const isCommerce = productionType === "campaign" || packageId.includes("ecommerce") || packageId.includes("product_ad") || /shopify|amazon|trendyol|woocommerce|marketplace/i.test(String(input.storePlatform ?? ""));

  if (isCommerce) {
    return {
      productionType,
      standard: "commerce_export",
      userPromise: "Marketplace/store-ready campaign assets are delivered with platform-specific copy, media files, export notes and a ZIP package when applicable.",
      requiredItems: ["Dashboard preview", "Final ad/video or visual asset", "Marketplace/store copy", "Store asset ZIP", "Platform README"],
      optionalItems: ["Shopify product copy", "Amazon listing bullets", "Trendyol listing text", "WooCommerce product description", "Banner/social variations", "Connected store export notes"],
      dashboardFields: ["preview_url", "delivery_zip_url", "delivery_link", "readme_url"],
      adminChecklist: ["Verify store platform", "Attach final media", "Attach marketplace copy/export file", "Attach ZIP package", "Attach README", "Mark ready and send completion email"],
      fileFormats: ["MP4", "PNG/JPG/WebP", "CSV/JSON/TXT", "MD/PDF", "ZIP"],
      costCredits: 450,
      costNote: "Commerce export package allowance: 450 credits"
    };
  }

  if (PROJECT_TYPES.has(productionType)) {
    return {
      productionType,
      standard: "project_source",
      userPromise: "Project source delivery includes preview access, source ZIP, README, setup/deploy notes and required asset folders when the production is ready.",
      requiredItems: ["Preview URL or screenshots", "Source ZIP", "README", "Setup/deploy guide", "Env/example notes"],
      optionalItems: ["Database schema guide", "Admin panel notes", "Expo/mobile build notes", "Store/app integration notes", "Asset folder"],
      dashboardFields: ["preview_url", "delivery_zip_url", "source_files_url", "readme_url"],
      adminChecklist: ["Attach preview URL", "Attach source ZIP", "Attach README", "Attach setup/deploy guide", "Check source package opens", "Mark ready and send completion email"],
      fileFormats: ["ZIP", "MD", "ENV example", "PNG/JPG screenshots", "URL"],
      costCredits: 650,
      costNote: "Project source delivery package allowance: 650 credits"
    };
  }

  if (BRAND_TYPES.has(productionType)) {
    return {
      productionType,
      standard: "brand_asset",
      userPromise: "Brand and visual deliveries include downloadable assets, usage notes and a ZIP package suitable for website, store and social use.",
      requiredItems: ["Visual preview", "Downloadable asset files", "Brand/usage notes", "ZIP package"],
      optionalItems: ["Logo PNG", "Logo SVG", "Palette JSON/CSS variables", "Typography notes", "Social avatar/banner sizes", "Brand guide PDF"],
      dashboardFields: ["preview_url", "delivery_zip_url", "source_files_url", "readme_url"],
      adminChecklist: ["Attach previews", "Attach asset ZIP", "Attach source/vector files if available", "Attach usage notes", "Mark ready and send completion email"],
      fileFormats: ["PNG", "SVG", "PDF", "CSS/JSON", "ZIP"],
      costCredits: 350,
      costNote: "Brand/visual asset delivery package allowance: 350 credits"
    };
  }

  if (DOCUMENT_TYPES.has(productionType)) {
    return {
      productionType,
      standard: "document_package",
      userPromise: "Document deliveries include final files, editable/source notes and a ZIP package when applicable.",
      requiredItems: ["Document preview", "Final PDF or document file", "Editable/source notes", "ZIP package"],
      optionalItems: ["Markdown source", "Pitch deck export", "Catalog images", "Usage notes"],
      dashboardFields: ["preview_url", "delivery_zip_url", "source_files_url", "readme_url"],
      adminChecklist: ["Attach final document", "Attach source/editable notes", "Attach ZIP package", "Mark ready and send completion email"],
      fileFormats: ["PDF", "MD/DOCX/PPTX", "PNG/JPG", "ZIP"],
      costCredits: 250,
      costNote: "Document/file delivery package allowance: 250 credits"
    };
  }

  return {
    productionType,
    standard: "media_final",
    userPromise: "Final media output is delivered through the dashboard with preview, download/share and revision options.",
    requiredItems: ["Preview", "Final delivery link"],
    optionalItems: ["ZIP package", "Source notes", "README"],
    dashboardFields: ["preview_url", "delivery_link"],
    adminChecklist: ["Attach preview/final link", "Mark ready and send completion email"],
    fileFormats: ["MP4", "PNG/JPG", "MP3/WAV", "ZIP"],
    costCredits: 0,
    costNote: ""
  };
}

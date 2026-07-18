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
  return `# Project Structure\n\nProduction: ${manifest.title}\n\n## Recommended Package Layout\n\n\`\`\`text\ndelivery/\n├─ README.md\n├─ manifest.json\n├─ preview.html\n├─ source/\n├─ admin-panel/\n├─ docs/\n├─ media/\n├─ brand-kit/\n└─ documents/\n\`\`\`\n\n## Technical Stack\n${manifest.project.technical_stack}\n\n## Modules\n${manifest.project.modules}\n`;
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

export function buildDeliveryEntries(production: ProductionLike): ZipEntry[] {
  const manifest = buildDeliveryManifest(production);
  const requirements = manifest.delivery_requirements;
  const entries: ZipEntry[] = [
    { name: "README.md", content: buildDeliveryReadme(production) },
    { name: "SOURCE-GUIDE.md", content: buildSourceGuide(production) },
    { name: "manifest.json", content: JSON.stringify(manifest, null, 2) },
    { name: "preview.html", content: buildPreviewHtml(production) }
  ];
  if (requirements.wantsSourceCode || ["website", "saas", "mobile_app", "admin_project"].includes(manifest.production_type)) entries.push({ name: "source/project-structure.md", content: buildProjectStructure(production) });
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

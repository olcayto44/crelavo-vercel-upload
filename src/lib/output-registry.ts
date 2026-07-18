export type OutputRegistryStatus = "pending" | "planned" | "generated_on_download" | "waiting_provider" | "ready" | "failed";

export type OutputRegistryItem = {
  id: string;
  outputType: "video" | "image" | "audio" | "subtitle" | "thumbnail" | "source" | "zip" | "readme" | "pdf" | "brand_kit" | "admin_panel" | "manifest" | "preview" | "document";
  deliveryRole: string;
  status: OutputRegistryStatus;
  filename: string;
  url?: string | null;
  note: string;
};

type RegistryProductionInput = {
  id: string;
  production_type?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  preview_url?: string | null;
  output_json?: Record<string, any> | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
};

function objectValue(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function deliveryRequirementsFrom(production: RegistryProductionInput) {
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const requirements = objectValue(metadata.deliveryRequirements) ?? objectValue(input.deliveryRequirements) ?? {};
  const formats = Array.isArray(requirements.formats) ? requirements.formats.map(String) : [];
  return {
    formats,
    wantsZip: Boolean(requirements.wantsZip ?? formats.includes("final_zip")),
    wantsSourceCode: Boolean(requirements.wantsSourceCode ?? formats.includes("source_code")),
    wantsReadme: Boolean(requirements.wantsReadme ?? formats.includes("readme")),
    wantsAdminPanel: Boolean(requirements.wantsAdminPanel ?? formats.includes("admin_panel")),
    wantsFinalVideo: Boolean(requirements.wantsFinalVideo ?? formats.includes("final_mp4")),
    wantsSubtitles: Boolean(requirements.wantsSubtitles ?? formats.includes("subtitle_file")),
    wantsThumbnail: Boolean(requirements.wantsThumbnail ?? formats.includes("thumbnail")),
    wantsPdf: Boolean(requirements.wantsPdf ?? formats.includes("pdf")),
    wantsBrandKit: Boolean(requirements.wantsBrandKit ?? formats.includes("brand_kit"))
  };
}

function registryItem(item: OutputRegistryItem): OutputRegistryItem {
  return item;
}

export function buildOutputRegistry(production: RegistryProductionInput): OutputRegistryItem[] {
  const output = production.output_json ?? {};
  const requirements = deliveryRequirementsFrom(production);
  const base = `/api/productions/${production.id}/delivery`;
  const items: OutputRegistryItem[] = [
    registryItem({ id: "manifest", outputType: "manifest", deliveryRole: "delivery_manifest", status: "generated_on_download", filename: "manifest.json", url: `${base}?file=manifest`, note: "Machine-readable delivery manifest." }),
    registryItem({ id: "readme", outputType: "readme", deliveryRole: "customer_instructions", status: production.readme_url ? "ready" : "generated_on_download", filename: "README.md", url: production.readme_url ?? `${base}?file=readme`, note: "Customer delivery README." }),
    registryItem({ id: "preview", outputType: "preview", deliveryRole: "browser_preview", status: production.preview_url ? "ready" : "generated_on_download", filename: "preview.html", url: production.preview_url ?? `${base}?file=preview`, note: "Browser preview or live output preview." })
  ];

  if (requirements.wantsZip || requirements.formats.includes("final_zip")) {
    items.push(registryItem({ id: "final_zip", outputType: "zip", deliveryRole: "final_delivery_package", status: production.delivery_zip_url || production.delivery_link ? "ready" : "generated_on_download", filename: "delivery-package.zip", url: production.delivery_zip_url ?? production.delivery_link ?? `${base}?file=zip`, note: "Final ZIP generated from requested delivery requirements." }));
  }
  if (requirements.wantsSourceCode || ["website", "saas", "mobile_app", "admin_project"].includes(String(production.production_type ?? ""))) {
    items.push(registryItem({ id: "source_code", outputType: "source", deliveryRole: "source_package", status: production.source_files_url ? "ready" : "generated_on_download", filename: "source-guide.md", url: production.source_files_url ?? `${base}?file=source`, note: "Source package or source delivery guide." }));
  }
  if (requirements.wantsAdminPanel) {
    items.push(registryItem({ id: "admin_panel", outputType: "admin_panel", deliveryRole: "admin_panel_package", status: "planned", filename: "admin-panel/admin-requirements.md", note: "Admin panel scope and package requirements." }));
  }
  if (requirements.wantsFinalVideo) {
    items.push(registryItem({ id: "final_video", outputType: "video", deliveryRole: "final_mp4", status: output.finalVideoUrl || production.delivery_link ? "ready" : "waiting_provider", filename: "final-video.mp4", url: output.finalVideoUrl ?? production.delivery_link ?? null, note: "Final MP4 from provider or admin upload." }));
  }
  if (requirements.wantsSubtitles) {
    items.push(registryItem({ id: "subtitles", outputType: "subtitle", deliveryRole: "subtitle_file", status: output.subtitleUrl ? "ready" : "planned", filename: "subtitles.srt", url: output.subtitleUrl ?? null, note: "Subtitle file for final media." }));
  }
  if (requirements.wantsThumbnail) {
    items.push(registryItem({ id: "thumbnail", outputType: "thumbnail", deliveryRole: "thumbnail", status: output.thumbnailUrl ? "ready" : "planned", filename: "thumbnail.png", url: output.thumbnailUrl ?? null, note: "Thumbnail or cover visual." }));
  }
  if (requirements.wantsPdf) {
    items.push(registryItem({ id: "pdf", outputType: "pdf", deliveryRole: "final_pdf", status: output.pdfUrl ? "ready" : "planned", filename: "final-document.pdf", url: output.pdfUrl ?? null, note: "PDF/document delivery output." }));
  }
  if (requirements.wantsBrandKit) {
    items.push(registryItem({ id: "brand_kit", outputType: "brand_kit", deliveryRole: "brand_kit", status: output.brandKitUrl ? "ready" : "planned", filename: "brand-kit/brand-guide.md", url: output.brandKitUrl ?? null, note: "Brand kit package and guide." }));
  }

  return items;
}

export function outputRegistrySummary(items: OutputRegistryItem[]) {
  return {
    total: items.length,
    ready: items.filter((item) => item.status === "ready" || item.status === "generated_on_download").length,
    waiting: items.filter((item) => item.status === "waiting_provider").length,
    planned: items.filter((item) => item.status === "planned" || item.status === "pending").length,
    failed: items.filter((item) => item.status === "failed").length
  };
}

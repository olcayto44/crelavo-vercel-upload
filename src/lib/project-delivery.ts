import { automaticDeliveryLinks } from "./automatic-delivery-builder.ts";
import { buildOutputRegistry } from "./output-registry.ts";
import { buildProductionWorkflowState } from "./production-workflow.ts";

type ProjectProduction = {
  id: string;
  title?: string | null;
  prompt?: string | null;
  production_type?: string | null;
  package_id?: string | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
};

const PROJECT_TYPES = new Set(["website", "saas", "mobile_app", "admin_project"]);

export function isAutomaticProjectDelivery(productionType: string, packageId = "") {
  const type = String(productionType || "");
  const pkg = String(packageId || "");
  if (!PROJECT_TYPES.has(type)) return false;
  return pkg.includes("website") || pkg.includes("mobile") || pkg.includes("saas") || pkg.includes("ecommerce") || pkg.includes("shopify_app") || PROJECT_TYPES.has(type);
}

function text(value: unknown, fallback = "Not specified") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function projectKind(type: string, packageId: string) {
  if (type === "mobile_app" || packageId.includes("mobile")) return "mobile_app";
  if (type === "saas" || packageId.includes("saas") || packageId.includes("shopify_app")) return "saas";
  if (packageId.includes("ecommerce") || packageId.includes("shopify")) return "ecommerce";
  if (type === "admin_project" || packageId.includes("admin")) return "admin_project";
  return "website";
}

function stackFor(kind: string, metadata: Record<string, any>, input: Record<string, any>) {
  const requested = text(metadata.projectWorkflow?.technicalStack ?? input.projectWorkflow?.technicalStack ?? metadata.technicalStack ?? input.technicalStack, "");
  if (requested) return requested;
  if (kind === "mobile_app") return "Expo / React Native, TypeScript, modular screens, API client, app source package";
  if (kind === "saas") return "Next.js, TypeScript, Supabase auth/database, dashboard/admin modules, billing hooks";
  if (kind === "ecommerce") return "Next.js storefront/admin source package, product catalog, cart/checkout flows, Shopify/export notes";
  if (kind === "admin_project") return "Next.js admin dashboard, Supabase, role-based modules, request/status management";
  return "Next.js, TypeScript, responsive pages, SEO metadata, contact/lead forms";
}

function modulesFor(kind: string, metadata: Record<string, any>, input: Record<string, any>) {
  const requested = text(metadata.projectWorkflow?.modules ?? input.projectWorkflow?.modules ?? metadata.project_modules ?? input.project_modules, "");
  if (requested) return requested;
  if (kind === "mobile_app") return "Onboarding, home screen, account/settings, core feature screens, API client, build notes";
  if (kind === "saas") return "Auth, dashboard, user workspace, admin panel, billing/credits, settings, audit-ready delivery";
  if (kind === "ecommerce") return "Storefront, product pages, cart, checkout notes, admin product management, order/dashboard notes";
  if (kind === "admin_project") return "Login, admin dashboard, user/request tables, status workflow, delivery/revision controls";
  return "Home page, service sections, lead form, pricing/CTA, SEO pages, deployment notes";
}

export function buildProjectDeliveryOutput(production: ProjectProduction, jobId: string) {
  const productionType = String(production.production_type ?? "website");
  const packageId = String(production.package_id ?? "");
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const links = automaticDeliveryLinks(production.id);
  const kind = projectKind(productionType, packageId);
  const title = text(production.title, "Crelavo project delivery");
  const brief = text(production.prompt ?? input.projectDetails ?? metadata.projectDetails, "Customer project brief");
  const stack = stackFor(kind, metadata, input);
  const modules = modulesFor(kind, metadata, input);
  const output = {
    automationMode: "fully_automatic_project_delivery",
    automationStatus: "ready",
    jobId,
    pipelineType: "automatic_project_source_package",
    currentStep: "Source package delivery generated",
    projectKind: kind,
    projectPackage: {
      title,
      brief,
      stack,
      modules,
      includedFiles: [
        "README.md",
        "manifest.json",
        "preview.html",
        "SOURCE-GUIDE.md",
        "source/project-structure.md",
        "source/app/page.tsx",
        "source/app/admin/page.tsx",
        "source/app/globals.css",
        "source/package.json",
        "docs/deployment-guide.md",
        "admin-panel/admin-requirements.md"
      ],
      deliveryStatus: "ready_for_customer_review",
      implementationStatus: "working_source_package_ready"
    },
    previewUrl: links.previewUrl,
    deliveryLink: links.deliveryLink,
    deliveryZipUrl: links.deliveryZipUrl,
    sourceFilesUrl: links.sourceFilesUrl,
    readmeUrl: links.readmeUrl,
    automaticDeliveryLinks: links,
    revisionActions: ["Update copy", "Change stack notes", "Add module", "Adjust admin panel", "Update deployment guide"],
    userMessage: "Project source package, README, setup guide and delivery ZIP are ready in the dashboard."
  };
  return {
    ...output,
    outputRegistry: buildOutputRegistry({
      ...production,
      preview_url: links.previewUrl,
      delivery_link: links.deliveryLink,
      delivery_zip_url: links.deliveryZipUrl,
      source_files_url: links.sourceFilesUrl,
      output_json: output
    }),
    workflowState: buildProductionWorkflowState({
      ...production,
      status: "ready",
      automation_status: "ready",
      generation_status: "project_delivery_ready",
      preview_url: links.previewUrl,
      delivery_link: links.deliveryLink,
      delivery_zip_url: links.deliveryZipUrl,
      source_files_url: links.sourceFilesUrl,
      output_json: output
    })
  };
}

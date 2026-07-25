import { apiServiceGroups as defaultApiServiceGroups, type ApiService, type ApiServiceGroup } from "@/lib/api-services";

export const API_SERVICES_CONFIG_KEY = "api_services";

export type ApiServicesPayload =
  | Partial<ApiServiceGroup>[]
  | { groups?: Partial<ApiServiceGroup>[] }
  | null
  | undefined;

const fallbackImage = "/blog/managed-delivery-workflow.svg";

function normalizeText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeSlug(value: unknown, fallback: string) {
  const text = String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return text || fallback;
}

function normalizeService(input: Partial<ApiService> | undefined, fallback: ApiService): ApiService {
  const service = input ?? {};
  return {
    slug: normalizeSlug(service.slug, fallback.slug),
    name: normalizeText(service.name, fallback.name),
    summary: normalizeText(service.summary, fallback.summary),
    useCase: normalizeText(service.useCase, fallback.useCase),
    image: normalizeText(service.image, fallback.image || fallbackImage),
    alt: normalizeText(service.alt, fallback.alt || `${fallback.name} service illustration`)
  };
}

function normalizeGroup(input: Partial<ApiServiceGroup> | undefined, fallback: ApiServiceGroup): ApiServiceGroup {
  const group = input ?? {};
  const title = normalizeText(group.title, fallback.title);
  const description = normalizeText(group.description, fallback.description);
  const incomingServices = Array.isArray(group.services) ? group.services : [];
  const incomingBySlug = new Map(incomingServices.map((service) => [normalizeSlug(service?.slug, ""), service] as const));
  const fallbackServices = fallback.services.map((service) => normalizeService(incomingBySlug.get(service.slug), service));
  const fallbackSlugs = new Set(fallbackServices.map((service) => service.slug));
  const customServices = incomingServices
    .filter((service) => normalizeSlug(service?.slug, "") && !fallbackSlugs.has(normalizeSlug(service?.slug, "")))
    .map((service, index) => normalizeService(service, {
      slug: `custom-api-service-${Date.now()}-${index + 1}`,
      name: "Custom API service",
      summary: "Custom editable API service card managed from the admin panel.",
      useCase: "Describe how this service card should appear on the public API documentation page.",
      image: fallbackImage,
      alt: "Custom API service illustration"
    }));
  return { title, description, services: [...fallbackServices, ...customServices] };
}

export function createCustomApiService(): ApiService {
  return {
    slug: `custom-api-service-${Date.now()}`,
    name: "Custom API service",
    summary: "Custom editable API service card managed from the admin panel.",
    useCase: "Describe how this service should appear on the public API documentation page.",
    image: fallbackImage,
    alt: "Custom API service illustration"
  };
}

export function createCustomApiServiceGroup(): ApiServiceGroup {
  return {
    title: "Custom API group",
    description: "Custom API service group managed from the admin panel.",
    services: [createCustomApiService()]
  };
}

export function normalizeApiServicesConfig(payload: ApiServicesPayload): ApiServiceGroup[] {
  const incoming = Array.isArray(payload) ? payload : Array.isArray(payload?.groups) ? payload.groups : [];
  const incomingByTitle = new Map(incoming.map((group) => [normalizeText(group?.title, ""), group] as const));
  const defaults = defaultApiServiceGroups.map((group) => normalizeGroup(incomingByTitle.get(group.title), group));
  const defaultTitles = new Set(defaults.map((group) => group.title));
  const customGroups = incoming
    .filter((group) => normalizeText(group?.title, "") && !defaultTitles.has(normalizeText(group?.title, "")))
    .map((group) => normalizeGroup(group, createCustomApiServiceGroup()));
  return [...defaults, ...customGroups];
}

export function flattenApiServices(groups: ApiServiceGroup[]) {
  return groups.flatMap((group) => group.services.map((service) => ({
    group: group.title,
    ...service
  })));
}

export { defaultApiServiceGroups };

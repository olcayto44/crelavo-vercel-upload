const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractProductionId(value: string) {
  const clean = String(value ?? "").trim();
  const match = clean.match(UUID_RE);
  return match ? match[0] : clean;
}

export function productionSlug(input: { id: string; title?: string | null; prompt?: string | null; production_type?: string | null; package_id?: string | null }) {
  const source = [input.title, input.production_type, input.package_id, input.prompt]
    .filter(Boolean)
    .join(" ")
    .slice(0, 150);
  const slug = source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return slug || "production-workspace";
}

export function productionWorkspacePath(input: { id: string; title?: string | null; prompt?: string | null; production_type?: string | null; package_id?: string | null }) {
  const id = String(input.id ?? "").trim();
  return `/dashboard/productions/${productionSlug(input)}-${id}`;
}

export type RuntimeCollection = { key: string; fields: string[]; private: boolean };
export type RuntimeSchema = { version: 1; collections: RuntimeCollection[] };
const reserved = new Set(["settings", "pages", "users", "uploads", "audit", "revisions", "sessions"]);
const dangerous = new Set(["__proto__", "constructor", "prototype", "password", "password_hash", "secret", "api_key", "token"]);
export function validateRuntimeSchema(value: unknown): RuntimeSchema {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("runtime_schema_required");
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !Array.isArray(raw.collections) || raw.collections.length < 1 || raw.collections.length > 30) throw new Error("runtime_schema_collections_invalid");
  const keys = new Set<string>();
  const collections = raw.collections.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("runtime_collection_invalid");
    const entry = item as Record<string, unknown>;
    if (typeof entry.key !== "string" || !/^[a-z][a-z0-9-]{0,49}$/.test(entry.key) || reserved.has(entry.key) || keys.has(entry.key)) throw new Error("runtime_collection_key_invalid");
    keys.add(entry.key);
    if (typeof entry.private !== "boolean") throw new Error("runtime_collection_privacy_required");
    if (!Array.isArray(entry.fields) || entry.fields.length < 1 || entry.fields.length > 40 || entry.fields.some(field => typeof field !== "string" || !/^[a-z][a-z0-9_]{0,49}$/.test(field) || dangerous.has(field))) throw new Error("runtime_collection_fields_invalid");
    const fields = Array.from(new Set(entry.fields as string[]));
    if (!fields.includes("title") && !fields.includes("name")) throw new Error("runtime_collection_title_required");
    return { key: entry.key, fields, private: entry.private };
  });
  return { version: 1, collections };
}

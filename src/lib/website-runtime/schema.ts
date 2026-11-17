export type RuntimeFieldType = "text" | "integer" | "number" | "boolean" | "url" | "date";
export type RuntimeCollection = { key: string; fields: string[]; private: boolean; fieldTypes?: Record<string, RuntimeFieldType>; filters?: string[] };
export type RuntimeSchema = { version: 1; collections: RuntimeCollection[] };
const reserved = new Set(["settings", "pages", "users", "uploads", "audit", "revisions", "sessions"]);
const dangerous = new Set(["__proto__", "constructor", "prototype", "password", "password_hash", "secret", "api_key", "token", "id", "published"]);
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
    if (!Array.isArray(entry.fields)) throw new Error("runtime_collection_fields_array_required");
    if (entry.fields.length < 1 || entry.fields.length > 40) throw new Error("runtime_collection_fields_count_invalid");
    if (entry.fields.some(field => typeof field !== "string")) throw new Error("runtime_collection_fields_strings_required");
    if (entry.fields.some(field => !/^[a-z][a-z0-9_]{0,49}$/.test(String(field)))) throw new Error("runtime_collection_field_name_invalid");
    if (entry.fields.some(field => dangerous.has(String(field)))) throw new Error("runtime_collection_field_reserved");
    const fields = Array.from(new Set(entry.fields as string[]));
    if (!fields.includes("title") && !fields.includes("name")) throw new Error("runtime_collection_title_required");
    let fieldTypes: RuntimeCollection["fieldTypes"];
    if (entry.fieldTypes !== undefined) {
      if (!entry.fieldTypes || typeof entry.fieldTypes !== "object" || Array.isArray(entry.fieldTypes)) throw new Error("runtime_field_types_invalid");
      fieldTypes = {};
      for (const [field, type] of Object.entries(entry.fieldTypes).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
        if (!fields.includes(field) || !["text", "integer", "number", "boolean", "url", "date"].includes(String(type))) throw new Error("runtime_field_type_invalid");
        if (["title", "name"].includes(field) && type !== "text") throw new Error("runtime_title_type_invalid");
        fieldTypes[field] = type as RuntimeFieldType;
      }
    }
    if (entry.filters !== undefined && (!Array.isArray(entry.filters) || entry.filters.some(field => typeof field !== "string" || !fields.includes(field) || field === "q"))) throw new Error("runtime_collection_filters_invalid");
    return { key: entry.key, fields, private: entry.private, ...(fieldTypes ? { fieldTypes } : {}), ...(entry.filters === undefined ? {} : { filters: [...new Set(entry.filters as string[])] }) };
  });
  return { version: 1, collections };
}

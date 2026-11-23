import type { RuntimeSchema } from "./schema.ts";
export type RuntimeWorkflow = { id: string; kind: "membership"; protectedCollections: string[] } | { id: string; kind: "booking"; collection: string } | { id: string; kind: "checkout"; collection: string; priceField: string; stockField?: string; currency: string };
export function validateRuntimeWorkflows(value: unknown, schema: RuntimeSchema): RuntimeWorkflow[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("runtime_workflows_invalid");
  const ids = new Set<string>();
  return value.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("runtime_workflow_invalid");
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== "string" || !/^[a-z][a-z0-9-]{0,49}$/.test(raw.id) || ids.has(raw.id)) throw new Error("runtime_workflow_id_invalid"); ids.add(raw.id);
    if (raw.kind === "membership") {
      if (!Array.isArray(raw.protectedCollections) || !raw.protectedCollections.length || raw.protectedCollections.some(key => !schema.collections.some(c => c.key === key && c.private))) throw new Error("runtime_membership_private_collection_required");
      return { id: raw.id, kind: "membership", protectedCollections: [...new Set(raw.protectedCollections as string[])] };
    }
    const collection = schema.collections.find(c => c.key === raw.collection && !c.private);
    if (!collection) throw new Error("runtime_workflow_public_collection_required");
    if (raw.kind === "booking") return { id: raw.id, kind: "booking", collection: collection.key };
    if (raw.kind !== "checkout" || typeof raw.priceField !== "string" || !collection.fields.includes(raw.priceField) || !["usd", "eur", "gbp", "try", "cad", "aud"].includes(String(raw.currency))) throw new Error("runtime_checkout_configuration_invalid");
    if (raw.stockField !== undefined && (typeof raw.stockField !== "string" || !collection.fields.includes(raw.stockField) || raw.stockField === raw.priceField)) throw new Error("runtime_checkout_stock_field_invalid");
    for (const field of [raw.priceField, raw.stockField].filter(Boolean) as string[]) if (collection.fieldTypes?.[field] && collection.fieldTypes[field] !== "integer") throw new Error("runtime_checkout_integer_type_required");
    return { id: raw.id, kind: "checkout", collection: collection.key, priceField: raw.priceField, currency: raw.currency as string, ...(raw.stockField ? { stockField: raw.stockField as string } : {}) };
  });
}

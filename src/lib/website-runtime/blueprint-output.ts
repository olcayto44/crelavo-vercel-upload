// Provider wire format is closed and required; semantic/security checks remain authoritative.
const string = { type: "string" };
const array = (items: unknown) => ({ type: "array", items });
const object = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties) });
const choice = (...values: string[]) => ({ type: "string", enum: values });
const nullable = (value: unknown) => ({ anyOf: [value, { type: "null" }] });
const item = object({ title: string, text: string });
const common = { title: string, layout: choice("stack", "split", "wide"), align: choice("start", "center"), tone: choice("surface", "accent", "plain") };
const block = (type: string, fields: Record<string, unknown>) => object({ type: choice(type), ...common, ...fields });
const pageFields = { title: string, purpose: string, collections: array(string), blocks: array({ anyOf: [
  block("text", { text: string }), block("collection", { collection: string }),
  block("image", { url: string, alt: string }), block("cta", { text: string, url: string, label: string }),
  block("hero", { text: string, eyebrow: nullable(string), imageUrl: nullable(string), imageAlt: nullable(string), buttonUrl: nullable(string), buttonLabel: nullable(string) }),
  block("features", { items: array(item) }), block("faq", { items: array(item) })
] }) };
// Home has no provider-controlled slug; other page slugs still undergo runtime validation.
const homePage = object(pageFields);
const otherPage = object({ slug: string, ...pageFields });
export const blueprintOutputFormat = {
  type: "json_schema",
  json_schema: { name: "website_application_blueprint", strict: true, schema: object({
    schema: object({ version: { type: "integer", enum: [1] }, collections: array(object({
      key: string, fields: array(string), private: { type: "boolean" },
      fieldDefinitions: array(object({ field: string, type: choice("text", "integer", "number", "boolean", "url", "date") })), filters: array(string)
    })) }),
    theme: object({ primaryColor: string, backgroundColor: string, textColor: string, font: choice("system-ui", "Georgia", "Arial"), radius: choice("square", "soft", "round"), spacing: choice("compact", "comfortable", "airy"), maxWidth: choice("narrow", "standard", "wide"), displayFont: choice("system-ui", "Georgia", "Arial") }),
    homePage,
    otherPages: array(otherPage),
    capabilities: array(object({ name: string, kind: choice("crud", "custom_workflow", "external_integration"), collections: array(string), workflowIds: array(string) })),
    workflows: array({ anyOf: [object({ id: string, kind: choice("membership"), protectedCollections: array(string) }), object({ id: string, kind: choice("booking"), collection: string }), object({ id: string, kind: choice("checkout"), collection: string, priceField: string, stockField: nullable(string), currency: choice("usd", "eur", "gbp", "try", "cad", "aud") })] })
  }) }
};
/** Convert provider pages and declared types, without inventing content or relaxing validation. */
export function decodeBlueprintOutput(value: unknown): unknown {
  const stripNull = (input: any): any => Array.isArray(input) ? input.map(stripNull) : input && typeof input === "object" ? Object.fromEntries(Object.entries(input).filter(([, v]) => v !== null).map(([k, v]) => [k, stripNull(v)])) : input;
  const raw = stripNull(value);
  if (value && typeof value === "object" && !Array.isArray(value) && ("homePage" in value || "otherPages" in value)) {
    if (!raw.homePage || typeof raw.homePage !== "object" || Array.isArray(raw.homePage)) throw new Error("blueprint_home_required");
    if (!Array.isArray(raw.otherPages)) throw new Error("blueprint_pages_invalid");
    if ("pages" in raw) throw new Error("blueprint_pages_invalid");
    raw.pages = [{ ...raw.homePage, slug: "home" }, ...raw.otherPages];
    delete raw.homePage;
    delete raw.otherPages;
  }
  // Legacy runtime pages are accepted as-is; never synthesize a missing home page.
  if (Array.isArray(raw?.schema?.collections)) raw.schema.collections = raw.schema.collections.map((collection: any) => {
    if (collection.fieldDefinitions === undefined) return collection;
    if (!Array.isArray(collection.fieldDefinitions)) throw new Error("runtime_field_types_invalid");
    const entries: Array<[string, string]> = [];
    for (const entry of collection.fieldDefinitions) {
      if (!entry || typeof entry.field !== "string" || typeof entry.type !== "string" || entries.some(([key]) => key === entry.field) || ["__proto__", "constructor", "prototype"].includes(entry.field)) throw new Error("runtime_field_type_invalid");
      entries.push([entry.field, entry.type]);
    }
    const { fieldDefinitions, ...rest } = collection;
    return { ...rest, fieldTypes: Object.fromEntries(entries) };
  });
  return raw;
}

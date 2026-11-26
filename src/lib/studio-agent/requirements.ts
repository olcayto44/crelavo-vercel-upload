import { z } from "zod";
import { CATEGORIES } from "@/lib/crelavo/categoryCatalog";
import { studioCategoryConfiguration } from "@/app/studio-design-test/category-config";

// Read-only projection: never replace the catalog, prices, or existing question UI.
const configuration = studioCategoryConfiguration();
const ids = CATEGORIES.map(category => category.id);
if (ids.length !== 28 || new Set(ids).size !== 28) throw new Error("category_catalog_contract_changed");
export const CategoryIdSchema = z.enum(ids as [string, ...string[]]);
const text = z.string().trim().min(1).max(6000);
const references = z.array(z.string().uuid()).min(1).max(10);
export type FieldContract = {
  id: string; label: string; sourceIds: string[]; required: boolean;
  kind: "text" | "select" | "references"; options: string[]; serverOnly?: boolean; mediaKinds?: string[];
};
export type CategoryContract = {
  id: string; kind: string; fields: FieldContract[]; defaults: Record<string, string>;
  planRequired: true; approval: "explicit_server_approval";
  execution: "catalog_only" | "existing_website_api_unbound";
  requiresReferencePermission: boolean;
  packs: { id: string; credits?: number; priceLabel?: string }[];
};
const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/g, "");
const critical: Record<string, string[]> = {
  website: ["business_name"], saas: ["product_name", "main_workflows"],
  mobile_app: ["target_platform", "main_features"], admin_project: ["managed_records"],
  video: [], talking_video: ["script"], documentary: ["subject_and_research_sources"],
  animation: ["animation_technique"], music_video: ["authorized_music_reference"],
  drama: ["story_premise"], cinematic_video: [], video_clipping: ["requested_clips"],
  video_tools: ["editing_operation", "source_video"], campaign: [], ad_score_checker: [],
  campaign_calendar: [], ai_agent: ["agent_purpose", "authorized_channels"],
  localization: [], cultural_localization: [], live_sales_agent: ["product_catalog"],
  avatar: [], lip_sync: ["source_face_video", "authorized_audio"],
  voice_clone: ["authorized_voice_reference", "script"], visual_clone: ["reference_images"],
  image: [], brand_kit: [], document_pack: [], anime_short_film: ["story_premise"],
  animal_video: ["animal_species"], nature_video: [], planet_space_video: ["astronomical_subject"],
  drone_video: ["location_and_coordinates"], stickman_animation: ["explainer_topic"],
  studio: ["series_premise", "production_scope"], crelavo_academy: [], community_showcase: [],
  virtual_model_studio: ["model_identity_and_appearance"],
};
const referenceLabels = new Set([
  "Reference media", "Reference photo or video", "Visual references", "Authorized music reference",
  "Source video", "Motion reference", "Continuity references", "Reference images", "Source face video",
  "Authorized audio", "Authorized voice reference", "Character references", "Published asset references",
]);
const contracts = new Map<string, CategoryContract>();
for (const category of CATEGORIES) {
  const source = configuration.categories.find(item => item.id === category.id)!;
  const fields = new Map<string, FieldContract>();
  fields.set("brief", { id: "brief", label: "Proje isteği", sourceIds: [], required: true, kind: "text", options: [] });
  // Extra-field IDs and select values remain canonical; existing generated question IDs remain traceable.
  for (const field of category.extras) fields.set(field.id, {
    id: field.id, label: field.label, sourceIds: [field.id], required: Boolean(field.required),
    kind: field.options?.length ? "select" : "text", options: field.options?.map(option => option.id) ?? [],
  });
  for (const question of source.questions) {
    const matching = category.extras.find(field => field.label.toLowerCase() === question.label.toLowerCase());
    const id = matching?.id ?? (category.id === "website" && question.label === "Required pages" ? "pages" : slug(question.label));
    const previous = fields.get(id);
    if (previous) previous.sourceIds.push(question.id);
    else fields.set(id, {
      id, label: question.label, sourceIds: [question.id], required: false,
      kind: referenceLabels.has(question.label) ? "references" : "text", options: [],
    });
  }
  for (const field of fields.values()) {
    field.serverOnly = /consent|permission|source_rights|approval_policy/.test(field.id);
    if (field.kind === "references") field.mediaKinds = /audio|voice|music/.test(field.id) ? ["audio"]
      : /photo_or_video/.test(field.id) ? ["image", "video"]
      : /source_video|source_face_video|motion_reference/.test(field.id) ? ["video"]
      : /images|character_references/.test(field.id) ? ["image"] : ["image", "audio", "video"];
  }
  if (fields.has("input")) fields.set("input_url", { id: "input_url", label: "Ürün veya sayfa bağlantısı", sourceIds: [], required: false, kind: "text", options: [] });
  for (const key of critical[category.id] ?? []) {
    const field = fields.get(key);
    if (!field) throw new Error(`critical_field_missing:${category.id}:${key}`);
    field.required = true;
  }
  // Defaults are proposals only. Never adopt sample industries, identity, permissions, or a content language.
  const defaults: Record<string, string> = {};
  const safeDefaults: Record<string, string> = category.id === "website"
    ? { site_type: "landing_page", design_style: "clean_and_minimal", stack: "preview_first" }
    : { stack: "preview_first" };
  for (const [key, value] of Object.entries(safeDefaults)) {
    if (fields.get(key)?.options.includes(value)) defaults[key] = value;
  }
  contracts.set(category.id, {
    id: category.id, kind: source.kind, fields: [...fields.values()], defaults,
    planRequired: true, approval: "explicit_server_approval",
    execution: category.id === "website" ? "existing_website_api_unbound" : "catalog_only",
    requiresReferencePermission: ["voice_clone", "visual_clone", "lip_sync", "music_video", "localization", "video_clipping", "community_showcase"].includes(category.id),
    packs: category.packs.map(({ id, credits, priceLabel }) => ({ id, credits, priceLabel })),
  });
}
export function getCategoryContract(categoryId: string): CategoryContract {
  const id = CategoryIdSchema.parse(categoryId);
  // Return a detached copy so one request cannot mutate another category's policy.
  return JSON.parse(JSON.stringify(contracts.get(id)!)) as CategoryContract;
}
export function createBriefFieldsSchema(categoryId: string) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of getCategoryContract(categoryId).fields.filter(item => !item.serverOnly)) {
    shape[field.id] = (field.kind === "references" ? references
      : field.kind === "select" ? z.enum(field.options as [string, ...string[]]) : field.id === "input_url" ? z.string().url().refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }, "https_url_required") : text).optional();
  }
  return z.strictObject(shape);
}
export const BriefSnapshotSchema = z.strictObject({
  categoryId: CategoryIdSchema, revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  fields: z.record(z.string(), z.union([text, references])),
}).superRefine((snapshot, ctx) => {
  const result = createBriefFieldsSchema(snapshot.categoryId).safeParse(snapshot.fields);
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue({
    code: "custom", path: ["fields", ...issue.path], message: issue.message,
  });
});
export type BriefSnapshot = z.infer<typeof BriefSnapshotSchema>;
const EvaluationContextSchema = z.strictObject({
  acceptedDefaults: z.array(z.string()).max(100).default([]),
  ownedReferenceIds: z.array(z.string().uuid()).max(100).default([]), referenceKinds: z.record(z.string().uuid(), z.enum(["image", "audio", "video"])).default({}),
  referencePermissionConfirmed: z.boolean().default(false),
});
const criticalQuestions: Record<string, string> = {
  brief: "Proje için ne hazırlamak istiyorsunuz?", business_name: "İşletmenizin adı nedir?",
  site_type: "Nasıl bir web sitesi istiyorsunuz?", language: "İçerik hangi dilde olsun?", stack: "Yalnızca önizleme mi, kaynak dosyaları da mı istiyorsunuz?",
  input: "Üretim metin, görsel, ses veya bağlantıdan hangisiyle başlasın?", aspect: "Çıktının en-boy oranı ne olsun?",
  duration: "Çıktı kaç saniye olsun?", sound: "Seslendirme, müzik veya sessiz çıktı tercihiniz nedir?",
  who: "Videoda kim görünsün?", format: "Görselin kullanım biçimi ne olsun?",
  source_url: "Kaynak video dosyasını veya bağlantısını paylaşır mısınız?", product_url: "Ürün bağlantısını paylaşır mısınız?",
  channel: "Hangi kanalda kullanılacak?", platform: "Hangi canlı satış platformu kullanılacak?",
  ad_url: "Değerlendirilecek reklamın bağlantısını paylaşır mısınız?", brand: "Marka veya ürününüz nedir?",
  period: "Kampanya hangi dönemi kapsasın?", market: "Hedef ülke veya pazar hangisi?",
  source_text: "Uyarlanacak kaynak metni paylaşır mısınız?", document_type: "Hangi belge türünü hazırlayalım?",
  content: "Belgenin içeriği veya ana hatları nedir?", brand_name: "Markanızın adı nedir?",
  topic: "Dersin konusu nedir?", project: "Sergilenecek projeyi anlatır mısınız?",
  product_name: "Ürünün adı nedir?", main_workflows: "Ürünün ana iş akışları nelerdir?",
  target_platform: "Uygulama hangi platformda çalışacak?", main_features: "Uygulamanın temel özellikleri nelerdir?",
  managed_records: "Yönetim panelinde hangi kayıtlar yönetilecek?", script: "Okunacak veya konuşulacak metni paylaşır mısınız?",
  subject_and_research_sources: "Belgeselin konusunu ve araştırma kaynaklarını paylaşır mısınız?",
  animation_technique: "Hangi animasyon tekniğini tercih ediyorsunuz?", authorized_music_reference: "Kullanma izniniz olan müzik referansını paylaşır mısınız?",
  story_premise: "Hikâyenin temel fikri nedir?", requested_clips: "Kaynak videodan hangi klipler çıkarılsın?",
  editing_operation: "Videoda hangi düzenleme yapılacak?", source_video: "Kaynak video dosyasını paylaşır mısınız?",
  agent_purpose: "Asistanın temel görevi nedir?", authorized_channels: "Asistanın kullanmasına izin verilen kanallar hangileri?",
  product_catalog: "Satılacak ürün kataloğunu paylaşır mısınız?", source_face_video: "Yüzün göründüğü kaynak videoyu paylaşır mısınız?",
  authorized_audio: "Kullanma izniniz olan ses kaydını paylaşır mısınız?", authorized_voice_reference: "İzinli ses referansınızı paylaşır mısınız?",
  reference_images: "Referans görsellerini paylaşır mısınız?", animal_species: "Hangi hayvan türü kullanılsın?",
  astronomical_subject: "Hangi gezegen veya uzay konusu işlenecek?", location_and_coordinates: "Konumu veya koordinatları paylaşır mısınız?",
  explainer_topic: "Açıklanacak konu nedir?", series_premise: "Serinin temel hikâyesi nedir?",
  production_scope: "Üretim kaç bölüm veya sahneyi kapsasın?", model_identity_and_appearance: "Sanal modelin görünümü nasıl olsun?",
};
export function evaluateRequirements(rawSnapshot: unknown, serverEvidence: unknown = {}) {
  const snapshot = BriefSnapshotSchema.parse(rawSnapshot);
  const evidence = EvaluationContextSchema.parse(serverEvidence);
  const contract = getCategoryContract(snapshot.categoryId);
  const fields = { ...snapshot.fields };
  for (const key of evidence.acceptedDefaults) {
    if (!(key in contract.defaults)) throw new Error("unknown_default");
    if (!(key in fields)) fields[key] = contract.defaults[key];
  }
  const missing = contract.fields.filter(field => field.required && !(field.id in fields)).map(field => ({
    fieldId: field.id, reason: "required_field", question: criticalQuestions[field.id] ?? "Bu adım için gereken bilgiyi paylaşır mısınız?",
  }));
  const selectedReferenceIds = contract.fields.flatMap(field => {
    const value = fields[field.id];
    return field.kind === "references" && Array.isArray(value) ? value : [];
  });
  for (const id of selectedReferenceIds) if (!evidence.ownedReferenceIds.includes(id)) missing.push({
    fieldId: "reference_ownership", reason: "server_verification_required", question: "Referans dosyasının size ait olduğu doğrulanmalı.",
  });
  if ((contract.requiresReferencePermission || selectedReferenceIds.length > 0) && !evidence.referencePermissionConfirmed) missing.push({
    fieldId: "reference_permission", reason: "server_confirmation_required", question: "Referansı kullanma izninizi doğrular mısınız?",
  });
  for (const field of contract.fields.filter(item => item.kind === "references")) {
    const value = fields[field.id];
    if (Array.isArray(value) && value.some(id => !field.mediaKinds?.includes(evidence.referenceKinds[id]))) missing.push({
      fieldId: field.id, reason: "reference_media_type_required", question: "Bu alan için uygun dosya türü sunucudan doğrulanmalı.",
    });
  }
  if (fields.who === "self_in_video" && !selectedReferenceIds.some(id => ["image", "video"].includes(evidence.referenceKinds[id]))) missing.push({
    fieldId: "presenter_reference", reason: "presenter_reference_required", question: "Kendinizin görünmesi için fotoğraf veya video referansı paylaşır mısınız?",
  });
  // Input-dependent critical facts are not erased by generic video defaults.
  const inputRequirements: Record<string, string> = {
    image_to_video: "image", voice_to_video: "audio", product_page_link_to_video: "url",
  };
  const selectedInput = typeof fields.input === "string" ? inputRequirements[fields.input] : undefined;
  if (selectedInput && (selectedInput === "url" ? !("input_url" in fields) : !selectedReferenceIds.some(id => evidence.referenceKinds[id] === selectedInput))) missing.push({
    fieldId: "input_reference", reason: "input_reference_required", question: "Seçtiğiniz üretim başlangıcı için referansı paylaşır mısınız?",
  });
  return {
    categoryId: contract.id, fields, missing, nextQuestion: missing[0] ?? null,
    proposedDefaults: { ...contract.defaults }, briefComplete: missing.length === 0,
    executionReady: false as const, execution: contract.execution,
    planRequired: contract.planRequired, approval: contract.approval,
  };
}
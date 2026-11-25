import { z } from "zod";
import { CategoryIdSchema, getCategoryContract } from "./requirements";
import { getProductionCapability } from "./capability-registry";
import { assertCreditAccount, creditPolicy, type BillingOperation } from "./billing-policy";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const shortText = z.string().trim().min(1).max(2000);
const empty = z.strictObject({});
// Deliberately restricted to actual existing Website text/list/FAQ keys, not CSS, scripts, image URLs, or publishing settings.
const textList = z.array(shortText).max(50);
const contentPatch = z.strictObject({
  siteTitle: shortText.optional(), tagline: shortText.optional(), heroTitle: shortText.optional(),
  heroBody: shortText.optional(), primaryCta: shortText.optional(), aboutTitle: shortText.optional(),
  aboutBody: shortText.optional(), contactTitle: shortText.optional(), contactBody: shortText.optional(),
  footerText: shortText.optional(), seoDescription: shortText.optional(),
  features: textList.optional(), featureBodies: textList.optional(), pricingTitles: textList.optional(),
  pricingBodies: textList.optional(), workflowTitles: textList.optional(), workflowBodies: textList.optional(), navLabels: textList.optional(),
  faq: z.array(z.strictObject({ question: shortText.max(500), answer: shortText })).max(20).optional(),
}).refine(value => Object.keys(value).length > 0, "empty_content_patch");
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const target = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const DesignCommandSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("set_background_color"), targetId: target, color }),
  z.strictObject({ operation: z.literal("set_text_color"), targetId: target, color }),
  z.strictObject({ operation: z.literal("set_heading_size"), targetId: target, size: z.enum(["sm", "md", "lg", "xl"]) }),
  z.strictObject({ operation: z.literal("set_button_style"), targetId: target, color, style: z.enum(["solid", "outline"]) }),
  z.strictObject({ operation: z.literal("add_section"), pageId: target, sectionType: z.enum(["hero", "features", "faq", "cta"]) }),
  z.strictObject({ operation: z.literal("remove_section"), targetId: target }),
  z.strictObject({ operation: z.literal("move_section"), targetId: target, position: z.number().int().min(0).max(100) }),
  z.strictObject({ operation: z.literal("set_image"), targetId: target, materialId: z.string().uuid() }),
  z.strictObject({ operation: z.literal("set_page_layout"), pageId: target, layout: z.enum(["stack", "split", "wide"]) }),
  z.strictObject({ operation: z.literal("set_responsive_layout"), targetId: target, breakpoint: z.enum(["mobile", "tablet", "desktop"]), layout: z.enum(["stack", "split", "wide"]) }),
]);
export const ToolActionSchema = z.discriminatedUnion("tool", [
  z.strictObject({ tool: z.literal("get_category_capabilities"), args: z.strictObject({ categoryId: CategoryIdSchema }) }),
  z.strictObject({ tool: z.literal("get_project_context"), args: empty }),
  z.strictObject({ tool: z.literal("get_credit_balances"), args: empty }),
  z.strictObject({ tool: z.literal("list_website_projects"), args: empty }),
  z.strictObject({ tool: z.literal("get_project_status"), args: empty }),
  z.strictObject({ tool: z.literal("create_website_plan"), args: z.strictObject({ packId: shortText }) }),
  z.strictObject({ tool: z.literal("request_plan_approval"), args: z.strictObject({ planHash: hash }) }),
  z.strictObject({ tool: z.literal("generate_website"), args: z.strictObject({ planHash: hash }) }),
  z.strictObject({ tool: z.literal("open_website_preview"), args: z.strictObject({ page: z.string().regex(/^[a-zA-Z0-9_-]+\.html$/).max(100) }) }),
  z.strictObject({ tool: z.literal("update_website_content"), args: z.strictObject({ expectedRevision: z.number().int().nonnegative(), patch: contentPatch }) }),
  z.strictObject({ tool: z.literal("list_website_revisions"), args: empty }),
  z.strictObject({ tool: z.literal("restore_website_revision"), args: z.strictObject({ revision: z.number().int().nonnegative() }) }),
  z.strictObject({ tool: z.literal("attach_website_reference"), args: z.strictObject({ materialId: z.string().uuid() }) }),
  z.strictObject({ tool: z.literal("get_website_delivery"), args: z.strictObject({ format: z.enum(["preview", "zip"]) }) }),
  z.strictObject({ tool: z.literal("update_website_design"), args: z.strictObject({ expectedRevision: z.number().int().nonnegative(), commands: z.array(DesignCommandSchema).min(1).max(20) }) }),
]);
export type ToolName = z.infer<typeof ToolActionSchema>["tool"];
type ToolContract = { operation: BillingOperation; scope: "read" | "plan" | "edit" | "produce";
  category: "all" | "website"; projectRequired: boolean; availability: "local_contract" | "existing_api_unbound" | "planned" };
const registry: Record<ToolName, ToolContract> = {
  get_category_capabilities: { operation: "project_read", scope: "read", category: "all", projectRequired: false, availability: "local_contract" },
  get_project_context: { operation: "project_read", scope: "read", category: "all", projectRequired: true, availability: "planned" },
  get_credit_balances: { operation: "project_read", scope: "read", category: "all", projectRequired: false, availability: "existing_api_unbound" },
  list_website_projects: { operation: "project_read", scope: "read", category: "website", projectRequired: false, availability: "existing_api_unbound" },
  get_project_status: { operation: "project_read", scope: "read", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  create_website_plan: { operation: "planning", scope: "plan", category: "website", projectRequired: false, availability: "existing_api_unbound" },
  request_plan_approval: { operation: "project_read", scope: "plan", category: "website", projectRequired: true, availability: "planned" },
  generate_website: { operation: "website_generation", scope: "produce", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  open_website_preview: { operation: "preview_read", scope: "read", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  update_website_content: { operation: "content_edit", scope: "edit", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  list_website_revisions: { operation: "revision_read", scope: "read", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  restore_website_revision: { operation: "content_restore", scope: "edit", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  attach_website_reference: { operation: "reference_attach", scope: "edit", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  get_website_delivery: { operation: "delivery_read", scope: "read", category: "website", projectRequired: true, availability: "existing_api_unbound" },
  // No approved price or runtime adapter exists for these commands. Always reject execution in B1.
  update_website_design: { operation: "paid_revision", scope: "edit", category: "website", projectRequired: true, availability: "planned" },
};
const ApprovalSchema = z.strictObject({
  projectId: z.string().uuid(), categoryId: z.literal("website"), planHash: hash,
  account: z.literal("production"), source: z.literal("explicit_user_confirmation"),
});
export const ServerToolContextSchema = z.strictObject({
  source: z.literal("verified_server"), userId: z.string().uuid(), categoryId: CategoryIdSchema,
  projectId: z.string().uuid().nullable(), ownerUserId: z.string().uuid().nullable(),
  scopes: z.array(z.enum(["read", "plan", "edit", "produce"])).max(4),
  creditAccount: z.enum(["assistant", "production", "none"]),
  currentPlanHash: hash.nullable(), approval: ApprovalSchema.nullable(),
  confirmedRestoreRevision: z.number().int().nonnegative().nullable(),
  ownedMaterialIds: z.array(z.string().uuid()).max(100),
});
export function listToolContracts(categoryId: string) {
  CategoryIdSchema.parse(categoryId);
  return Object.entries(registry).filter(([, value]) => value.category === "all" || value.category === categoryId)
    .map(([name, value]) => ({ name, ...value, billing: creditPolicy(value.operation) }));
}
export function validateToolAction(rawAction: unknown, trustedServerContext: unknown) {
  const action = ToolActionSchema.parse(rawAction);
  // This is an authorization contract, NOT authentication. Only a future authenticated server adapter may provide this evidence.
  const context = ServerToolContextSchema.parse(trustedServerContext);
  if ((context.projectId === null) !== (context.ownerUserId === null)
    || (context.projectId !== null && context.ownerUserId !== context.userId)) throw new Error("project_ownership_required");
  const contract = registry[action.tool];
  if (contract.category !== "all" && contract.category !== context.categoryId) throw new Error("category_scope_mismatch");
  if (action.tool === "get_category_capabilities" && action.args.categoryId !== context.categoryId) throw new Error("category_scope_mismatch");
  if (!context.scopes.includes(contract.scope)) throw new Error("tool_scope_denied");
  if (contract.projectRequired && (!context.projectId || context.ownerUserId !== context.userId)) throw new Error("project_ownership_required");
  assertCreditAccount(contract.operation, context.creditAccount);
  if (action.tool === "create_website_plan" && !getCategoryContract("website").packs.some(pack => pack.id === action.args.packId)) throw new Error("unknown_pack");
  if (action.tool === "request_plan_approval" && context.currentPlanHash !== action.args.planHash) throw new Error("stale_plan");
  if (action.tool === "generate_website") {
    const approval = context.approval;
    if (!approval || approval.projectId !== context.projectId || approval.categoryId !== context.categoryId
      || approval.planHash !== action.args.planHash || context.currentPlanHash !== action.args.planHash) throw new Error("explicit_matching_plan_approval_required");
  }
  if (action.tool === "restore_website_revision" && context.confirmedRestoreRevision !== action.args.revision) throw new Error("explicit_restore_confirmation_required");
  if (action.tool === "attach_website_reference" && !context.ownedMaterialIds.includes(action.args.materialId)) throw new Error("material_ownership_required");
  return { action, context, contract: { ...contract } };
}
export function executeB1Tool(rawAction: unknown, trustedServerContext: unknown) {
  const { action, context, contract } = validateToolAction(rawAction, trustedServerContext);
  if (action.tool === "get_category_capabilities") return {
    category: getCategoryContract(context.categoryId), tools: listToolContracts(context.categoryId), capability: getProductionCapability(context.categoryId), executionReady: false as const,
  };
  // No fallback, injected executor, network call, provider invocation, or balance mutation exists here.
  throw new Error(contract.availability === "planned" ? "tool_not_supported_yet" : "tool_adapter_not_connected");
}
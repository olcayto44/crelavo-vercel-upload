import { CATEGORIES, getCategory } from "@/lib/crelavo/categoryCatalog";
import { getCategoryContract } from "./requirements";
import {productionRouteInventory} from "./production-routing";
import {studioAssistantWorkflow} from "./shared-assistant-workflow";
import { getCategorySpecialist } from "./category-specialists";

// Read-only foundation. Catalog descriptions are not evidence of executable tools.
// Do not use this projection as permission to call a provider or spend credits.
export type CapabilityEvidence = "catalog_only" | "existing_api_unbound" | "local_editor_implemented" | "provider_adapter_coded" | "planned";
export type OperationCapability = { id: string; label?: string; evidence: CapabilityEvidence; executionReady: false; customerAvailableInSeparateEditor: boolean };
const localImageOperations = ["image_import", "image_center_crop", "image_rotate_flip", "image_color_adjust", "image_png_export"];
const plannedImageOperations = ["image_background_remove", "image_background_replace", "image_object_remove", "image_object_add_replace", "image_inpaint", "image_outpaint", "image_generate", "image_to_image", "image_character_consistency", "image_product_consistency", "image_upscale", "image_layers_masks_brush", "image_text_logo_effects", "image_undo_redo", "image_project_persistence", "image_jpeg_webp_export", "image_assistant_edit"];
const imageOperations: OperationCapability[] = [
 ...localImageOperations.map(id => ({id, evidence:"local_editor_implemented" as const, executionReady:false as const, customerAvailableInSeparateEditor:true})),
 ...plannedImageOperations.map(id => ({id, evidence:id==="image_generate"?"provider_adapter_coded" as const:"planned" as const, executionReady:false as const, customerAvailableInSeparateEditor:false})),
];
export function getProductionCapability(categoryId: string) {
 const contract = getCategoryContract(categoryId);
 const category = getCategory(contract.id)!;
 const specialist = getCategorySpecialist(contract.id);
 const operations: OperationCapability[] = [
  ...category.features.map(feature => ({id:"catalog:"+feature.id, label:feature.label, evidence:"catalog_only" as const, executionReady:false as const, customerAvailableInSeparateEditor:false})),
  ...specialist.futureTools.map((id,index) => ({id, label:specialist.phases[index], evidence:"planned" as const, executionReady:false as const, customerAvailableInSeparateEditor:false})),
  ...(category.id==="website" ? [{id:"website_existing_builder", evidence:"existing_api_unbound" as const, executionReady:false as const, customerAvailableInSeparateEditor:false}] : []),
  ...(category.id==="image" ? imageOperations : []),
 ];
 return structuredClone({
  id: category.id, label: category.label, group: category.group, billing:category.billing,
  features: category.features, fields:contract.fields, defaults:contract.defaults, packs:contract.packs, proposedOutputs:specialist.outputs, qualityChecks:specialist.quality, planRequired:contract.planRequired, approval:contract.approval,
  stagedProduction:{schema:"studio-stage-v1",supportsCheckpointResume:true,implementation:["image","brand_kit","visual_clone","virtual_model_studio"].includes(category.id)?"image_adapter_coded":"adapter_pending",executionReady:false},creditPolicy:{account:"production",requiresAvailableCredits:category.billing==="credits",insufficientCreditStatus:402,topUpUrl:"/dashboard/payment",mustReserveBeforeProvider:true,stagedPolicy:"reserve_each_step_then_settle_verified_output",pauseOnInsufficient:true,resumeFromCheckpoint:true},productionRoutes:productionRouteInventory(category.id),assistantWorkflow:studioAssistantWorkflow(category.id),requiresReferencePermission:contract.requiresReferencePermission, specialistAdapterStatus:specialist.adapterStatus,
  executionReady:false as const, execution:contract.execution, operations,
  releaseGates:["verified_provider_capability","authenticated_owner_scope","server_approved_plan","server_tariff_and_credit_reservation","validated_real_output","idempotency_and_reconciliation","end_to_end_acceptance"],
 });
}
export function listProductionCapabilities() {
 return CATEGORIES.map(category => getProductionCapability(category.id));
}

// Compact model-facing evidence: never expose internal plan identifiers as
// executable actions. No database reads or credentials needed.
export function productionCapabilitySummary(categoryId:string) {
 const c=getProductionCapability(categoryId);
 return {category:c.label, executionReady:c.executionReady, separateLocalOperations:c.operations.filter(o=>o.evidence==="local_editor_implemented").map(o=>o.id), existingWebsiteBridge:c.execution==="existing_website_api_unbound",assistantWorkflow:c.assistantWorkflow,productionRoutes:c.productionRoutes, statement:"Catalog features and proposed outputs are requirements, not delivered artifacts. Routes describe coded adapters only. Website AI copy is not complete code or visual generation. Provider activation and verified approval are still required."};
}

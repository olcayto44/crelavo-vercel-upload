import {z} from "zod";
import {BriefSnapshotSchema,createBriefFieldsSchema,evaluateRequirements,getCategoryContract} from "./requirements";
const Revision=z.strictObject({categoryId:z.string(),expectedRevision:z.number().int().nonnegative(),patch:z.record(z.string(),z.unknown())});
// Shared assistant/manual edit boundary for every category. This pure function is not
// authorization, persistence, cost approval or a provider dispatch. Server must load
// the owned current project and perform CAS before persisting any returned revision.
export function prepareStudioBriefRevision(currentRaw:unknown,proposalRaw:unknown){
 const current=BriefSnapshotSchema.parse(currentRaw),proposal=Revision.parse(proposalRaw);
 if(proposal.categoryId!==current.categoryId)throw Error("category_mismatch");
 if(proposal.expectedRevision!==current.revision||current.revision>=Number.MAX_SAFE_INTEGER)throw Error("stale_revision");
 const patch=createBriefFieldsSchema(current.categoryId).parse(proposal.patch);
 const fields={...current.fields,...patch};
 const next=BriefSnapshotSchema.parse({categoryId:current.categoryId,revision:current.revision+1,fields});
 const changed=Object.keys(patch).filter(k=>JSON.stringify(current.fields[k])!==JSON.stringify(next.fields[k]));
 if(!changed.length)throw Error("no_changes");
 return {snapshot:next,changed,requirements:evaluateRequirements(next),invalidatePreviousPlan:true as const,requiresFreshApproval:true as const,executionReady:false as const};
}
export function studioAssistantWorkflow(categoryId:string){
 const c=getCategoryContract(categoryId);
 return {categoryId:c.id,entry:"natural_language_request",steps:["understand_request","resolve_missing_required_facts","propose_plan","review_and_quote","explicit_production_approval","dispatch_verified_adapter","validate_artifact","open_category_editor","manual_or_assistant_revision","deliver_validated_artifact"],revision:{expectedRevisionRequired:true,sharedBriefSchema:true,previousPlanInvalidated:true,paidRevisionRequiresFreshApproval:true},executionReady:false as const};
}

import { z } from "zod";
import type { ConversationProject } from "./conversation-contract";
import { getCategorySpecialist } from "./category-specialists";
import { mockApprovalValid } from "./approval-manager";
const Proposal=z.strictObject({userId:z.string().uuid(),projectId:z.string().uuid(),categoryId:z.string().max(80),tool:z.string().max(80),planVersion:z.number().int().positive(),planHash:z.string().length(64),budgetCredits:z.number().int().nonnegative(),parameters:z.strictObject({stepId:z.string().max(80)})});
// Model proposals and client parameters never grant permissions. This module has no
// network, provider, account or database adapter. Even valid approval cannot execute.
export function inspectMockToolProposal(raw:unknown,project:ConversationProject,actor:string){
 const parsed=Proposal.safeParse(raw);
 if(!parsed.success)return {allowed:false as const,code:"invalid_tool_proposal",executionReady:false as const};
 const p=parsed.data,plan=project.advanced?.plan;
 const code=actor!==project.userId||p.userId!==actor||p.projectId!==project.id||p.categoryId!==project.categoryId?"tool_scope_mismatch"
 :!getCategorySpecialist(project.categoryId).futureTools.includes(p.tool)?"unknown_category_tool"
 :!plan||p.planVersion!==plan.version||p.planHash!==plan.hash||!mockApprovalValid(project)?"approval_required"
 :!plan.steps.some(s=>s.id===p.parameters.stepId&&s.futureTool===p.tool)?"invalid_tool_parameters"
 :"production_adapters_disconnected";
 return {allowed:false as const,code,executionReady:false as const};
}
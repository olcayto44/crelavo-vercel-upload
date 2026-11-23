import { ConversationError, type ConversationProject } from "./conversation-contract";
import { isCurrentPlan, planningRequirements } from "./planning-engine";
import { hydrateProject } from "./project-memory";
export function approveMockPlan(raw:ConversationProject,actor:string,version:number,hash:string):ConversationProject {
 const p=hydrateProject(raw),a=structuredClone(p.advanced!),plan=a.plan;
 if(actor!==p.userId)throw new ConversationError("project_not_found",404);
 if(!plan||!isCurrentPlan(p)||plan.version!==version||plan.hash!==hash)throw new ConversationError("stale_plan_approval",409);
 if(a.conflicts.length||planningRequirements(p).missing.length||plan.blockers.length)throw new ConversationError("plan_requirements_unresolved",409);
 a.approval={userId:actor,projectId:p.id,categoryId:p.categoryId,planVersion:plan.version,briefVersion:a.briefVersion,planHash:hash,approvedAt:new Date().toISOString(),mockOnly:true};
 a.stage="mock_approved";
 return {...p,advanced:a};
}
export function mockApprovalValid(project:ConversationProject){
 const a=project.advanced,b=a?.approval,p=a?.plan;
 return Boolean(b&&p&&isCurrentPlan(project)&&!a!.conflicts.length&&!planningRequirements(project).missing.length&&
 b.userId===project.userId&&b.projectId===project.id&&b.categoryId===project.categoryId&&b.planVersion===p.version&&b.briefVersion===a!.briefVersion&&b.planHash===p.hash&&b.mockOnly);
}
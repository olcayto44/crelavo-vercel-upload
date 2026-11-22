import { createHash } from "node:crypto";
import { AdvancedPlanSchema, type AdvancedPlan } from "./advanced-contract";
import { getCategorySpecialist } from "./category-specialists";
import { evaluateRequirements } from "./requirements";
import { hydrateProject } from "./project-memory";
import type { ConversationProject } from "./conversation-contract";
export function planDigest(plan:Omit<AdvancedPlan,"hash">){return createHash("sha256").update(JSON.stringify(plan)).digest("hex");}
export function planningRequirements(project:ConversationProject){
 const result=evaluateRequirements(project.snapshot),referenceIds=new Set(getCategorySpecialist(project.categoryId).fieldSchemas.filter(f=>f.kind==="references").map(f=>f.id));
 return {...result,authoringMissing:result.missing.filter(m=>m.reason==="required_field"&&!referenceIds.has(m.fieldId))};
}
export function buildMockPlan(raw:ConversationProject,note=""):ConversationProject {
 const project=hydrateProject(raw),a=structuredClone(project.advanced!),s=getCategorySpecialist(project.categoryId),r=planningRequirements(project);
 if(r.authoringMissing.length)throw new Error("brief_incomplete");
 const fields=project.snapshot.fields,all=Object.keys(fields).sort();
 const facts=all.filter(k=>k!=="brief").map(k=>k.replace(/_/g," ")+": "+String(fields[k]).slice(0,120)).join("; ").slice(0,700);
 const draft:Omit<AdvancedPlan,"hash">={version:(a.plan?.version??0)+1,briefVersion:a.briefVersion,categoryId:project.categoryId,
 title:s.label+" plan",expertise:s.expertise,notes:note.slice(0,1000),
 steps:s.phases.map((title,index)=>({id:"step_"+(index+1),title,
 detail:(index===0?String(fields.brief).slice(0,250)+". Confirmed constraints: "+facts:index===s.phases.length-1?s.quality.join("; "):title+" for the confirmed project; proposed deliverable: "+s.outputs[Math.min(index-1,s.outputs.length-1)]) .slice(0,1000),
 inputs:all,futureTool:s.futureTools[index]})),outputs:s.outputs,qualityChecks:s.quality,
 blockers:[...new Set([...r.missing.map(m=>m.fieldId),...a.conflicts.map(c=>"conflict:"+c.fieldId)])],
 executionReady:false,adapterStatus:"disconnected"};
 const plan=AdvancedPlanSchema.parse({...draft,hash:planDigest(draft)});
 if(a.plan)a.planHistory=[...a.planHistory,a.plan].slice(-3);
 a.plan=plan;a.approval=null;a.stage=a.conflicts.length?"needs_resolution":"plan_review";
 if(note)a.revisionRequests=[...a.revisionRequests,{planVersion:plan.version,note:note.slice(0,1000)}].slice(-20);
 return {...project,advanced:a};
}
export function isCurrentPlan(project:ConversationProject){
 const a=project.advanced,p=a?.plan;if(!a||!p||p.briefVersion!==a.briefVersion||p.categoryId!==project.categoryId)return false;
 const {hash,...rest}=p;return hash===planDigest(rest);
}
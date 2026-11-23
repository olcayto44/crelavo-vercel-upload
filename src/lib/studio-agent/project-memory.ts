import { AdvancedStateSchema, type AdvancedState } from "./advanced-contract";
import type { ConversationProject, ProviderInput } from "./conversation-contract";
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function hydrateProject(project:ConversationProject):ConversationProject {
 if(project.advanced){
  const a=AdvancedStateSchema.parse(project.advanced);
  if(a.userId!==project.userId||a.projectId!==project.id||a.categoryId!==project.categoryId)throw new Error("advanced_scope_mismatch");
  return {...project,advanced:a};
 }
 const a:AdvancedState={version:1,userId:project.userId,projectId:project.id,categoryId:project.categoryId,briefVersion:0,
  briefHistory:[{version:0,fields:structuredClone(project.snapshot.fields)}],decisions:[],conflicts:[],askedFields:[],plan:null,planHistory:[],approval:null,revisionRequests:[],stage:"collecting",memory:"signed_browser_demo",executionReady:false};
 return {...project,advanced:a};
}
export function updateProjectMemory(previous:ConversationProject,next:ConversationProject,input:ProviderInput,conflicts:AdvancedState["conflicts"]):ConversationProject {
 const p=hydrateProject(previous),a=structuredClone(p.advanced!);
 const changedKeys=Object.keys(next.snapshot.fields).filter(k=>!same(p.snapshot.fields[k],next.snapshot.fields[k]));
 const oldConflicts=a.conflicts.filter(c=>!changedKeys.includes(c.fieldId)&&!conflicts.some(n=>n.fieldId===c.fieldId));
 a.conflicts=[...oldConflicts,...conflicts].slice(-40);
 // A clear, explicit value also resolves a conflict even when it equals the prior saved value.
 const explicit=input.message.split(/[\n;]/).map(line=>line.match(/^\s*([a-z_]+)\s*:/i)?.[1]).filter(Boolean);
 a.conflicts=a.conflicts.filter(c=>!explicit.includes(c.fieldId)||conflicts.some(n=>n.fieldId===c.fieldId));
 const changed=changedKeys.length>0||!same(a.conflicts,p.advanced!.conflicts);
 if(changed){
  a.briefVersion++;
  for(const fieldId of changedKeys)a.decisions.push({version:a.briefVersion,fieldId,previous:String(p.snapshot.fields[fieldId]??"").slice(0,1000),value:String(next.snapshot.fields[fieldId]).slice(0,1000),source:input.acceptedDefaults.includes(fieldId)?"accepted_default":"explicit_message"});
  a.decisions=a.decisions.slice(-60);a.approval=null;
  a.briefHistory.push({version:a.briefVersion,fields:structuredClone(next.snapshot.fields)});a.briefHistory=a.briefHistory.slice(-3);
  // Bound history independently of conversation text and the current brief.
  while(a.briefHistory.length>1&&JSON.stringify(a.briefHistory).length>60000)a.briefHistory.shift();
 }
 a.stage=a.conflicts.length?"needs_resolution":a.approval?"mock_approved":a.plan?"plan_review":"collecting";
 return {...next,advanced:AdvancedStateSchema.parse(a)};
}
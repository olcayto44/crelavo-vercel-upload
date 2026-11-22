import { ConversationError, type ConversationProject, type ProviderInput, type TurnResponse } from "./conversation-contract";
import { analyzeMockInput } from "./requirement-analyzer";
import { hydrateProject, updateProjectMemory } from "./project-memory";
import { buildMockPlan, isCurrentPlan, planningRequirements } from "./planning-engine";
import { approveMockPlan, mockApprovalValid } from "./approval-manager";
import { getCategoryContract } from "./requirements";
import { getCategorySpecialist } from "./category-specialists";
type Applied={project:ConversationProject;reply:string;blockedTools:string[];nextQuestion:TurnResponse["nextQuestion"]};
export function advanceMockConversation(input:ProviderInput,applied:Applied):Applied {
 const analysis=analyzeMockInput(input),projectBefore=hydrateProject(input.project);
 let project=updateProjectMemory(projectBefore,applied.project,input,analysis.conflicts),a=project.advanced!;
 const message=input.message.toLowerCase(),r=planningRequirements(project),changed=a.briefVersion!==projectBefore.advanced!.briefVersion;
 let reply=applied.reply,nextQuestion=applied.nextQuestion;
 const requested=/\b(?:make|create|build|rebuild|prepare)(?: a| the| my)? plan\b|plan hazirla|planla/.test(message);
 const read=/what.*(?:decided|agreed)|summari[sz]e.*(?:project|brief)|project context|neler.*karar|proje.*ozet/.test(message);
 const attemptedApproval=/^(?:approve(?: the)? plan|i approve(?: the plan)?|plani onayla)[.!\s]*$/.test(message);
 const revision=message.match(/^(?:revise plan|plan revision)\s*:\s*([\s\S]+)/);
 if(!r.authoringMissing.length&&!a.conflicts.length&&(changed||requested||revision)){
  project=buildMockPlan(project,revision?input.message.slice(input.message.indexOf(":")+1).trim().slice(0,1000):"");a=project.advanced!;
  reply=input.uiLanguage==="tr"?"Kategoriye özel taslak planı Brief & Plan sekmesine ekledim. Gerçek üretim kapalı.":"I added a category-specific draft to Brief & Plan. Review it there; real production remains disabled.";
  if(a.plan!.blockers.length)reply+=input.uiLanguage==="tr"?" Referans ve izin doğrulaması bekleniyor.":" Reference and permission verification remain unresolved.";
  nextQuestion=null;
 }else if(requested&&r.authoringMissing.length){reply=input.uiLanguage==="tr"?"Plan için gereken brief bilgileri henüz tamamlanmadı.":"The brief still needs required details before I can draft the plan.";nextQuestion={fieldId:r.authoringMissing[0].fieldId,question:r.authoringMissing[0].question};}
 if(a.conflicts.length){reply=(input.uiLanguage==="tr"?"Çelişen tercihleri kaydetmedim; tek bir seçim belirtin: ":"I did not silently choose between conflicting preferences. Specify one value for: ")+a.conflicts.map(c=>c.fieldId.replace(/_/g," ")+" ("+c.values.join(" / ")+")").join("; ");nextQuestion=null;}
 if(read){reply=Object.entries(project.snapshot.fields).map(([key,value])=>key.replace(/_/g," ")+": "+String(value)).join("\n").slice(0,5000)||"No project decisions have been saved yet.";nextQuestion=null;}
 if(attemptedApproval){reply=input.uiLanguage==="tr"?"Onay için Brief & Plan sekmesindeki sürüme bağlı Mock onay düğmesini kullanın. Bu işlem üretim başlatmaz.":"Use the version-bound Mock approval button in Brief & Plan. Approval never starts production.";nextQuestion=null;}
 if(nextQuestion){
  const unasked=r.missing.find(m=>!a.askedFields.includes(m.fieldId));
  nextQuestion=unasked?{fieldId:unasked.fieldId,question:input.uiLanguage==="tr"?unasked.question:"Please specify "+(getCategoryContract(project.categoryId).fields.find(f=>f.id===unasked.fieldId)?.label||unasked.fieldId.replace(/_/g," "))+"."}:null;
  // Replace the generic trailing question rather than repeat it on every turn.
  const base=applied.nextQuestion?reply.replace(new RegExp("\\n\\n"+escape(applied.nextQuestion.question)+"$"),""):reply;
  reply=nextQuestion?base+"\n\n"+nextQuestion.question:base;
  if(nextQuestion)a.askedFields=[...a.askedFields,nextQuestion.fieldId].slice(-80);
 }
 reply=reply.slice(0,6000);const messages=[...project.messages];if(messages.at(-1)?.role==="assistant")messages[messages.length-1]={role:"assistant",content:reply};
 return {...applied,project:{...project,messages,advanced:a},reply,nextQuestion};
}
const escape=(s:string)=>s.replace(/[.*+?^$()|[\]\\]/g,"\\$&");
export type MockPlanCommand={operation:"create"|"rebuild"|"revise"|"approve"|"revoke";expectedPlanVersion:number;expectedPlanHash:string|null;note?:string};
export function handleMockPlanCommand(raw:ConversationProject,actor:string,command:MockPlanCommand){
 let project=hydrateProject(raw);const current=project.advanced!.plan;
 if(actor!==project.userId)throw new ConversationError("project_not_found",404);
 if((current?.version??0)!==command.expectedPlanVersion||(current?.hash??null)!==command.expectedPlanHash)throw new ConversationError("stale_plan_approval",409);
 if(command.operation==="approve")project=approveMockPlan(project,actor,command.expectedPlanVersion,command.expectedPlanHash||"");
 else if(command.operation==="revoke")project={...project,advanced:{...project.advanced!,approval:null,stage:project.advanced!.conflicts.length?"needs_resolution":current?"plan_review":"collecting"}};
 else {if(command.operation==="revise"&&!command.note?.trim())throw new ConversationError("revision_note_required",400);
  if(command.operation==="revise"){
   // Only explicit, schema-valid labeled facts change the brief. Free-form creative
   // notes remain annotations, not claims of general AI interpretation.
   const input:ProviderInput={project,message:command.note!,uiLanguage:"en",acceptedDefaults:[]},analysis=analyzeMockInput(input);
   const fields={...project.snapshot.fields,...analysis.patch};const changed=JSON.stringify(fields)!==JSON.stringify(project.snapshot.fields);
   project=updateProjectMemory(project,{...project,snapshot:{...project.snapshot,fields,revision:project.snapshot.revision+Number(changed)}},input,analysis.conflicts);
  }
  try{project=buildMockPlan(project,command.operation==="revise"?command.note:"");}catch(error){throw new ConversationError(error instanceof Error?error.message:"plan_failed",409);}}
 const reply=command.operation==="approve"?"Mock plan approved for this exact version. No production was started.":command.operation==="revoke"?"Mock approval revoked. Production remains disabled.":"Category-specific plan updated. Revision notes are stored as user instructions, not interpreted by a real model. Production remains disabled.";
 project={...project,messages:[...project.messages,{role:"user",content:"Mock plan action: "+command.operation+(command.note?" ? "+command.note:"")},{role:"assistant",content:reply}].slice(-50) as ConversationProject["messages"]};
 return {project,reply};
}
export function advancedCanvasState(project:ConversationProject){
 const a=project.advanced;if(!a)return null;
 const s=getCategorySpecialist(project.categoryId),r=planningRequirements(project),current=isCurrentPlan(project),approved=mockApprovalValid(project);
 return {memory:a.memory,briefVersion:a.briefVersion,planVersion:a.plan?.version??0,planHash:a.plan?.hash??null,
 planState:a.conflicts.length?"blocked":!a.plan?"not_generated":!current?"stale":a.plan.blockers.length?"blocked":approved?"mock_approved":"review",approved,
 stage:a.stage,expertise:s.expertise,conflicts:a.conflicts,decisions:a.decisions,plan:a.plan,
 canDraft:r.authoringMissing.length===0,canApprove:current&&!r.missing.length&&!a.conflicts.length,executionReady:false};
}
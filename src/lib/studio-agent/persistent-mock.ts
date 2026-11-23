import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { ConversationError, ConversationRequestSchema, ProjectSchema, type ConversationProject, type Wallets } from "./conversation-contract";
import { handleStudioConversation } from "./conversation-handler";
import { MemoryConversationStore } from "./mock-conversation";
import { hydrateProject } from "./project-memory";
import { newPreviewState, signPreviewState } from "./preview-state";
import { studioPlanningState } from "./planning-state";
export interface MemoryRPC {rpc(name:string,args:Record<string,unknown>):Promise<{data:unknown;error:{message:string}|null}>;}
export type StoredMock={project:ConversationProject;stateRevision:number;wallets:Wallets;reply:string;chargedCredits:number;requestId:string};
export function localMemoryAllowed(){return process.env.STUDIO_AGENT_TEST_OFFLINE==="true"&&process.env.STUDIO_AGENT_LOCAL_MEMORY_ENABLED==="true"&&process.env.NODE_ENV!=="production"&&["preview","development"].includes(process.env.VERCEL_ENV||"");}
function guard(){if(!localMemoryAllowed())throw new ConversationError("isolated_local_memory_disabled",403);}
const wallet=z.strictObject({balance:z.number().int().nonnegative(),reserved:z.number().int().nonnegative(),available:z.number().int().nonnegative()});
const Envelope=z.object({project:ProjectSchema,stateRevision:z.number().int().nonnegative(),wallets:z.strictObject({assistant:wallet,production:wallet}),reply:z.string().max(6000),chargedCredits:z.number().int().nonnegative(),requestId:z.string().uuid(),mode:z.literal("mock"),memory:z.literal("isolated_postgres"),executionReady:z.literal(false)});
export function createPersistentMockStore(db:MemoryRPC){
 async function call(name:string,args:Record<string,unknown>){guard();if(!["studio_memory_load","studio_memory_request","studio_memory_commit","studio_memory_list"].includes(name))throw new ConversationError("unknown_memory_rpc",400);
  const {data,error}=await db.rpc(name,args);if(error){const code=["project_not_found","project_changed_reload","request_payload_conflict","stale_plan_approval","immutable_brief_conflict","immutable_plan_conflict","isolated_local_memory_required"].find(c=>error.message.includes(c));throw new ConversationError(code||"memory_storage_unavailable",code==="project_not_found"?404:code?409:503);}return data;
 }
 const decode=(data:unknown):StoredMock=>{const parsed=Envelope.parse(data);if(parsed.project.advanced?.memory!=="isolated_postgres")throw new ConversationError("memory_storage_unavailable");return parsed;};
 return {
  async list(user:string,category:string){return z.array(z.strictObject({id:z.string().uuid(),title:z.string().max(160),categoryId:z.string().max(80),stateRevision:z.number().int().nonnegative()})).max(50).parse(await call("studio_memory_list",{p_user:user,p_category:category}));},
  async load(user:string,project:string,category:string){return decode(await call("studio_memory_load",{p_user:user,p_project:project,p_category:category}));},
  async replay(user:string,project:string,category:string,request:string,hash:string){const value=await call("studio_memory_request",{p_user:user,p_project:project,p_category:category,p_request:request,p_hash:hash});return value?decode(value):null;},
  async save(user:string,project:ConversationProject,expected:number,request:string,hash:string,result:{wallets:Wallets;reply?:string;chargedCredits?:number}){
   const p=ProjectSchema.parse(project);if(p.userId!==user||p.productionId!==null||p.advanced?.memory!=="isolated_postgres")throw new ConversationError("project_not_found",404);
   return decode(await call("studio_memory_commit",{p_user:user,p_project:p.id,p_category:p.categoryId,p_request:request,p_expected:expected,p_hash:hash,p_payload:JSON.stringify({project:p,wallets:result.wallets,reply:result.reply||"",chargedCredits:result.chargedCredits||0})}));
  },
 };
}
export type PersistentMockStore=ReturnType<typeof createPersistentMockStore>;
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
// Private local harness surface, NOT an exported app/API route. A verified server
// identity is required; browser tokens/fields never become database state directly.
export async function handlePersistentMock(request:Request,deps:{authenticate:()=>Promise<{userId:string}>;store:PersistentMockStore}){
 const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
 try{
  guard();if(!["127.0.0.1","localhost","[::1]"].includes(new URL(request.url).hostname))throw new ConversationError("isolated_local_memory_disabled",403);
  const auth=await deps.authenticate();const user=z.string().uuid().parse(auth.userId);
  if(request.method==="GET")return json({ok:true,mockAllowed:true,realEnabled:false,isolatedPreview:true,memory:"isolated_postgres",executionReady:false});
  if(request.method!=="POST")throw new ConversationError("method_not_allowed",405);
  const text=await request.text();if(Buffer.byteLength(text)>450000)throw new ConversationError("request_too_large",413);
  let raw:unknown;try{raw=JSON.parse(text);}catch{throw new ConversationError("invalid_json",400);}
  const body=ConversationRequestSchema.parse(raw);if(body.mode!=="mock")throw new ConversationError("real_ai_dispatch_closed",403);
  if("mockState"in body&&body.mockState)throw new ConversationError("local_state_server_owned",400);
  if(body.action==="bind_website")throw new ConversationError("isolated_preview_no_production_access",403);
  if(body.action==="projects")return json({ok:true,projects:await deps.store.list(user,body.categoryId),mode:"mock",memory:"isolated_postgres",executionReady:false});
  if(body.action==="create"){
   if(body.productionId)throw new ConversationError("isolated_preview_no_production_access",403);
   const memory=new MemoryConversationStore();const p=hydrateProject(memory.create(user,body.categoryId,body.title||"Yerel Mock projesi"));p.advanced!.memory="isolated_postgres";
   const stored=await deps.store.save(user,p,-1,randomUUID(),digest(["create",p.id,user,body.categoryId]),{wallets:memory.wallets});return json(present(stored));
  }
  const hash=digest(body);
  if(body.action!=="load"){const cached=await deps.store.replay(user,body.projectId,body.categoryId,body.requestId,hash);if(cached)return json(present(cached));}
  const previous=await deps.store.load(user,body.projectId,body.categoryId);
  if(body.action==="load")return json(present(previous));
  const token=signPreviewState(newPreviewState(previous.project,previous.wallets));
  const inner=new Request("http://127.0.0.1/api/studio/conversation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,mockState:token})});
  const response=await handleStudioConversation(inner,{authenticate:async()=>({userId:user,db:{} as never})});
  const result=await response.json();if(!response.ok)return json(result,response.status);
  const stored=await deps.store.save(user,ProjectSchema.parse(result.project),previous.stateRevision,body.requestId,hash,result);
  return json({...present(stored),blockedTools:result.blockedTools||[],nextQuestion:result.nextQuestion||null});
 }catch(error){const known=error instanceof ConversationError;return json({ok:false,code:known?error.code:error instanceof z.ZodError?"invalid_request":"memory_storage_unavailable",executionReady:false,safeToRetryAutomatically:false},known?error.status:error instanceof z.ZodError?400:503);}
}
function present(stored:StoredMock){return {ok:true,...stored,mode:"mock",memory:"isolated_postgres",planning:studioPlanningState(stored.project),executionReady:false};}
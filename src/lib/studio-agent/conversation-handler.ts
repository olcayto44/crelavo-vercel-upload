import { createHash } from "node:crypto";
import { CategoryIdSchema } from "./requirements";
import { executeB1Tool } from "./tool-registry";
import { hydrateProject } from "./project-memory";
import { handleMockPlanCommand } from "./assistant-core";
import type { supabaseAdmin } from "@/lib/supabase";
import { ZodError } from "zod";
import { ConversationError, ConversationRequestSchema, type TurnResponse, type ConversationProject } from "./conversation-contract";
import { createDatabaseConversationStore, legacyWebsiteMemory } from "./conversation-store";
import { readAssistantTariff, runConversation, conversationPayloadHash } from "./conversation-engine";
import { createExistingProviderAdapter } from "./provider-adapter";
import { MemoryConversationStore, createMockConversationProvider } from "./mock-conversation";
import { mockPreviewAllowed, newPreviewState, readPreviewState, signPreviewState } from "./preview-state";
import { studioReadiness } from "./readiness"; import { studioPlanningState } from "./planning-state";
type DB = ReturnType<typeof supabaseAdmin>;
export async function handleStudioConversation(request:Request,deps:{authenticate:()=>Promise<{userId:string;db:DB}>}) {
  const json=(body:unknown,status=200)=>{const result=body as {project?:ConversationProject};return Response.json(result?.project?{...result,planning:studioPlanningState(result.project)}:body,{status,headers:{"Cache-Control":"no-store"}})};
  try {
    const {userId,db}=await deps.authenticate();
    if(request.method==="GET"){
      const query=new URL(request.url).searchParams;
      if(query.has("capabilities")){
        if(query.getAll("capabilities").length!==1)throw new ConversationError("invalid_request",400);
        const categoryId=CategoryIdSchema.parse(query.get("capabilities"));
        // Context originates only from authenticated server identity; no client scopes, project IDs or approval.
        const result=executeB1Tool({tool:"get_category_capabilities",args:{categoryId}},{source:"verified_server",userId,categoryId,projectId:null,ownerUserId:null,scopes:["read"],creditAccount:"none",currentPlanHash:null,approval:null,confirmedRestoreRevision:null,ownedMaterialIds:[]});
        return json({ok:true,...result});
      }
      const readiness=await studioReadiness(db);return json({ok:true,mockAllowed:mockPreviewAllowed(),realEnabled:readiness.ready,readiness,isolatedPreview:process.env.STUDIO_AGENT_ISOLATED_PREVIEW==="true",executionReady:false});}
    if(request.method!=="POST")return json({ok:false,code:"method_not_allowed"},405);
    if(Number(request.headers.get("content-length")||0)>450000)throw new ConversationError("request_too_large",413);
    const raw=await request.text();if(Buffer.byteLength(raw)>450000)throw new ConversationError("request_too_large",413);
    let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new ConversationError("invalid_json",400);}
    const body=ConversationRequestSchema.parse(parsed);
    if(body.mode==="mock") {
      if(body.action==="bind_website")throw new ConversationError("mock_binding_not_allowed",403);
      if(!mockPreviewAllowed())throw new ConversationError("mock_mode_not_allowed",403);
      if(body.action==="projects")return json({ok:true,mode:"mock",projects:[],memory:"signed_browser_demo"});
      if(body.action==="create") {
        if(body.productionId&&process.env.STUDIO_AGENT_ISOLATED_PREVIEW==="true")throw new ConversationError("isolated_preview_no_production_access",403); if(body.productionId&&body.categoryId!=="website")throw new ConversationError("category_scope_mismatch",403);
        const initial=await legacyWebsiteMemory(db,userId,body.productionId);
        const store=new MemoryConversationStore();
        const project=hydrateProject(store.create(userId,body.categoryId,body.title||initial.title,{productionId:initial.productionId,
          snapshot:{categoryId:body.categoryId,revision:0,fields:initial.fields},messages:initial.messages}));
        const state=newPreviewState(project,store.wallets);
        return json({ok:true,mode:"mock",project,wallets:state.wallets,mockState:signPreviewState(state),memory:"signed_browser_demo",executionReady:false});
      }
      if(!body.mockState)throw new ConversationError("mock_state_required",400);
      const state=readPreviewState(body.mockState,userId,body.projectId,body.categoryId);
      state.project=hydrateProject(state.project);
      if(body.action==="load")return json({ok:true,mode:"mock",project:state.project,wallets:state.wallets,mockState:signPreviewState(state),memory:"signed_browser_demo",executionReady:false});
      if(body.action==="plan"){
        const hash=createHash("sha256").update(JSON.stringify([body.projectId,body.categoryId,body.operation,body.expectedPlanVersion,body.expectedPlanHash,body.note||""])).digest("hex");
        if(state.last?.requestId===body.requestId){if(state.last.hash!==hash)throw new ConversationError("request_payload_conflict",409);return json({ok:true,mode:"mock",project:state.project,reply:state.last.reply,wallets:state.wallets,chargedCredits:0,executionReady:false,memory:"signed_browser_demo",mockState:signPreviewState(state)});}
        const result=handleMockPlanCommand(state.project,userId,body);
        return json({ok:true,mode:"mock",...result,wallets:state.wallets,chargedCredits:0,executionReady:false,memory:"signed_browser_demo",mockState:signPreviewState({...state,project:result.project,last:{requestId:body.requestId,hash,reply:result.reply,chargedCredits:0}})});
      }
      const hash=conversationPayloadHash(body);
      if(state.last?.requestId===body.requestId) {
        if(state.last.hash!==hash)throw new ConversationError("request_payload_conflict",409);
        return json({ok:true,mode:"mock",project:state.project,reply:state.last.reply,requestId:body.requestId,chargedCredits:state.last.chargedCredits,chargedAccount:"assistant",wallets:state.wallets,blockedTools:[],executionReady:false,mockState:body.mockState});
      }
      const store=new MemoryConversationStore(structuredClone(state.wallets));store.projects.set(state.project.id,state.project);
      const result=await runConversation({...body,userId}, {store,provider:createMockConversationProvider(),tariff:{version:"mock-v1",inputPer1K:1,outputPer1K:1},mode:"mock"});
      // Bounded demo memory in a server-signed, owner/category-scoped browser token. This is NOT durable DB memory.
      let chars=0;const messages=[];
      for(const message of [...result.project.messages].reverse()){if(chars+message.content.length>16000)break;chars+=message.content.length;messages.unshift(message);}
      const project:ConversationProject={...result.project,messages};
      return json({...result,project,memory:"signed_browser_demo",mockState:signPreviewState({...state,project,wallets:result.wallets,last:{requestId:body.requestId,hash,reply:result.reply,chargedCredits:result.chargedCredits}})});
    }
    if(body.action==="plan")throw new ConversationError("advanced_planning_mock_only",403);
    // No implicit mock fallback. New server flags are off unless explicitly configured AFTER offline migration review.
    const readiness=await studioReadiness(db);if(!readiness.ready)throw new ConversationError("studio_not_ready"); const tariff=readAssistantTariff();const provider=createExistingProviderAdapter();provider.preflight();
    const store=createDatabaseConversationStore(db);
    if(body.categoryId==="website"&&(body.action==="message"||body.action==="bind_website")){
      // A private CMS-bound project must use the saved-design revision endpoint
      // with its explicit quote and server-verified site context, not generic chat.
      const {data:binding,error:bindingError}=await db.from("studio_agent_website_bindings").select("project_id").eq("user_id",userId).eq("project_id",body.projectId).maybeSingle();
      if(bindingError)throw new ConversationError("studio_storage_unavailable");
      if(binding)throw new ConversationError("website_revision_endpoint_required",409);
    }
    if(body.action==="bind_website") {
      if(body.categoryId!=="website"||process.env.STUDIO_AGENT_ISOLATED_PREVIEW==="true")throw new ConversationError("website_binding_not_allowed",403);
      const {data:website,error:websiteError}=await db.from("production_requests").select("id").eq("id",body.productionId).eq("user_id",userId).eq("production_type","website").maybeSingle();
      if(websiteError)throw new ConversationError("studio_storage_unavailable");
      if(!website)throw new ConversationError("website_project_not_found",404);
      const existing=await store.load(userId,body.projectId,"website");
      if(existing.productionId&&existing.productionId!==body.productionId)throw new ConversationError("website_already_bound",409);
      if(!existing.productionId){
        const {data:bound,error:bindError}=await db.from("studio_agent_projects").update({production_id:body.productionId}).eq("id",body.projectId).eq("user_id",userId).eq("category_id","website").is("production_id",null).select("id").maybeSingle();
        if(bindError)throw new ConversationError("studio_storage_unavailable");
        if(!bound){const latest=await store.load(userId,body.projectId,"website");if(latest.productionId!==body.productionId)throw new ConversationError("website_binding_conflict",409);}
      }
      return json({ok:true,mode:"real",project:await store.load(userId,body.projectId,"website"),wallets:await store.wallets(userId),memory:"database",executionReady:false});
    }
    if(body.action==="projects")return json({ok:true,mode:"real",projects:await store.list(userId,body.categoryId),wallets:await store.wallets(userId),memory:"database"});
    if(body.action==="create")return json({ok:true,mode:"real",project:await store.create(userId,body.categoryId,body.title,body.productionId),wallets:await store.wallets(userId),memory:"database",executionReady:false});
    if(body.action==="load")return json({ok:true,mode:"real",project:await store.load(userId,body.projectId,body.categoryId),wallets:await store.wallets(userId),memory:"database",executionReady:false});
    const result:TurnResponse=await runConversation({...body,userId},{store,provider,tariff,mode:"real"});
    return json({...result,wallets:await store.wallets(userId),memory:"database"});
  } catch(error) {
    const known=error instanceof ConversationError;
    return json({ok:false,code:known?error.code:error instanceof ZodError?"invalid_request":"studio_unavailable",safeToRetryAutomatically:false,
      billingState:known&&error.outcome==="uncertain"?"reconciliation_required":"not_confirmed",executionReady:false},known?error.status:error instanceof ZodError?400:503);
  }
}
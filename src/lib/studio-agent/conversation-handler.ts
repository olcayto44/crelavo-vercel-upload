import type { supabaseAdmin } from "@/lib/supabase";
import { ZodError } from "zod";
import { ConversationError, ConversationRequestSchema, type TurnResponse, type ConversationProject } from "./conversation-contract";
import { createDatabaseConversationStore, legacyWebsiteMemory } from "./conversation-store";
import { readAssistantTariff, runConversation, conversationPayloadHash } from "./conversation-engine";
import { createExistingProviderAdapter } from "./provider-adapter";
import { MemoryConversationStore, createMockConversationProvider } from "./mock-conversation";
import { mockPreviewAllowed, newPreviewState, readPreviewState, signPreviewState } from "./preview-state";
import { evaluateRequirements } from "./requirements";
type DB = ReturnType<typeof supabaseAdmin>;
export async function handleStudioConversation(request:Request,deps:{authenticate:()=>Promise<{userId:string;db:DB}>}) {
  const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
  try {
    const {userId,db}=await deps.authenticate();
    if(request.method==="GET")return json({ok:true,mockAllowed:mockPreviewAllowed(),realEnabled:process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true",executionReady:false});
    if(request.method!=="POST")return json({ok:false,code:"method_not_allowed"},405);
    if(Number(request.headers.get("content-length")||0)>450000)throw new ConversationError("request_too_large",413);
    const raw=await request.text();if(Buffer.byteLength(raw)>450000)throw new ConversationError("request_too_large",413);
    let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new ConversationError("invalid_json",400);}
    const body=ConversationRequestSchema.parse(parsed);
    if(body.mode==="mock") {
      if(!mockPreviewAllowed())throw new ConversationError("mock_mode_not_allowed",403);
      if(body.action==="projects")return json({ok:true,mode:"mock",projects:[],memory:"signed_browser_demo"});
      if(body.action==="create") {
        if(body.productionId&&body.categoryId!=="website")throw new ConversationError("category_scope_mismatch",403);
        const initial=await legacyWebsiteMemory(db,userId,body.productionId);
        const store=new MemoryConversationStore();
        const project=store.create(userId,body.categoryId,body.title||initial.title,{productionId:initial.productionId,
          snapshot:{categoryId:body.categoryId,revision:0,fields:initial.fields},messages:initial.messages});
        const state=newPreviewState(project,store.wallets);
        return json({ok:true,mode:"mock",project,wallets:state.wallets,mockState:signPreviewState(state),memory:"signed_browser_demo",executionReady:false});
      }
      if(!body.mockState)throw new ConversationError("mock_state_required",400);
      const state=readPreviewState(body.mockState,userId,body.projectId,body.categoryId);
      if(body.action==="load")return json({ok:true,mode:"mock",project:state.project,wallets:state.wallets,mockState:body.mockState,memory:"signed_browser_demo",executionReady:false});
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
    // No implicit mock fallback. New server flags are off unless explicitly configured AFTER offline migration review.
    const tariff=readAssistantTariff();const provider=createExistingProviderAdapter();provider.preflight();
    const store=createDatabaseConversationStore(db);
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

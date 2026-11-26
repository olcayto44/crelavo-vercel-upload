import type {supabaseAdmin} from "@/lib/supabase";
import {ZodError,z} from "zod";
import {ConversationError,type TurnResponse} from "./conversation-contract";
import {createDatabaseConversationStore,studioRPC} from "./conversation-store";
import {readAssistantTariff,runConversation} from "./conversation-engine";
import {readCostPolicy} from "./cost-policy";
import {studioReadiness} from "./readiness";
import {createExistingProviderAdapter} from "./provider-adapter";
import {prepareWebsiteRevisionContext,validateWebsiteAIRevision,type WebsiteRevisionContext} from "./website-revision-context";
import {applyWebsiteRevision} from "../website-assistant-revision";
import {issueWebsiteRevisionQuote,verifyWebsiteRevisionQuote,websiteRevisionQuote,WebsiteRevisionRequest} from "./website-revision-quote";
type DB=ReturnType<typeof supabaseAdmin>;
const Binding=z.strictObject({siteId:z.string().uuid(),version:z.number().int().positive(),design:z.unknown(),projectId:z.string().uuid().nullable()});
function output(result:TurnResponse,context:WebsiteRevisionContext){
 const proposal=result.websiteRevisionProposal;
 if(!proposal)return {ok:true,state:"settled",chargedCredits:result.chargedCredits,reply:result.reply,design:null};
 if(proposal.siteId!==context.siteId||proposal.baseHash!==context.baseHash||proposal.expectedRevision!==context.version)throw new ConversationError("project_changed_reload",409);
 const checked=validateWebsiteAIRevision(context,{expectedRevision:proposal.expectedRevision,commands:proposal.commands});
 if(checked.resultHash!==proposal.resultHash)throw new ConversationError("revision_result_invalid");
 const next=applyWebsiteRevision(context.design,context.version,{expectedRevision:checked.expectedRevision,commands:checked.commands});
 return {ok:true,state:"settled",chargedCredits:result.chargedCredits,reply:result.reply,design:next.design,baseVersion:context.version,proposalOnly:true};
}
export async function handleWebsiteAssistantRevision(request:Request,deps:{authenticate:()=>Promise<{userId:string;db:DB}>}){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
 try{
  const {userId,db}=await deps.authenticate();
  const raw=await request.text();if(Buffer.byteLength(raw)>12000)throw new ConversationError("request_too_large",413);
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new ConversationError("invalid_json",400);}
  const body=WebsiteRevisionRequest.parse(parsed);
  const binding=Binding.parse(await studioRPC(db,"studio_agent_website_context",{p_user:userId,p_site:body.siteId,p_version:body.version,p_create:body.action==="connect"}));
  const context=prepareWebsiteRevisionContext({siteId:binding.siteId,version:binding.version,design:binding.design});
  const secret=process.env.STUDIO_AGENT_WEBSITE_REVISION_QUOTE_SECRET||"";
  const enabled=process.env.STUDIO_AGENT_WEBSITE_REVISION_ENABLED==="true"&&secret.length>=32;
  const readiness=enabled?await studioReadiness(db):null;
  const ready=enabled&&readiness?.ready===true;
  if(body.action==="status"||body.action==="connect")return json({ok:true,connected:!!binding.projectId,ready,baseVersion:context.version,blockers:enabled?readiness?.blockers??[]:["website_revision_disabled"]});
  if(!binding.projectId)throw new ConversationError("connect_website_first",409);
  const store=createDatabaseConversationStore(db);
  if(body.action==="result"){
   const {data,error}=await db.from("studio_agent_requests").select("state,response,result").eq("user_id",userId).eq("project_id",binding.projectId).eq("category_id","website").eq("request_id",body.requestId).maybeSingle();
   if(error)throw new ConversationError("studio_storage_unavailable");
   if(!data)return json({ok:true,state:"not_found"});
   if(data.state==="settled")return json(output(data.response as TurnResponse,context));
   // Result-only recovery cannot invoke the provider. Settlement requires existing recorded usage.
   if(data.state==="result_ready"){
    const p=data.result?.websiteRevisionProposal;
    if(p&&(p.siteId!==context.siteId||p.baseHash!==context.baseHash||p.expectedRevision!==context.version))throw new ConversationError("project_changed_reload",409);
    return json(output(await store.settle(userId,body.requestId,"real"),context));
   }
   return json({ok:true,state:String(data.state)});
  }
  if(!ready)throw new ConversationError("studio_not_ready");
  const project=await store.load(userId,binding.projectId,"website");
  const tariff=readAssistantTariff(),policy=readCostPolicy(),provider=createExistingProviderAdapter();provider.preflight();
  const {data:config,error:configError}=await db.from("studio_agent_cost_config").select("policy,tariff_version,input_units,output_units").eq("singleton",true).maybeSingle();
  if(configError||!config||config.tariff_version!==tariff.version||config.input_units!==tariff.inputPer1K||config.output_units!==tariff.outputPer1K||!config.policy||Object.keys(policy).length!==Object.keys(config.policy).length||Object.entries(policy).some(([k,v])=>config.policy[k]!==v))throw new ConversationError("budget_policy_mismatch",409);
  const quote=websiteRevisionQuote({userId,requestId:body.requestId,message:body.message,project,context,provider,tariff,policy});
  if(body.action==="quote"){
   const wallets=await store.wallets(userId);
   if(wallets.assistant.available<quote.maxCredits)throw new ConversationError("insufficient_assistant_credits",402);
   return json({ok:true,quote:issueWebsiteRevisionQuote(quote.fingerprint,secret),maxCredits:quote.maxCredits,expiresInSeconds:300,baseVersion:context.version});
  }
  verifyWebsiteRevisionQuote(body.quote,quote.fingerprint,secret);
  if(body.approvedMaxCredits!==quote.maxCredits)throw new ConversationError("quote_changed_reload",409);
  const result=await runConversation({userId,projectId:binding.projectId,categoryId:"website",requestId:body.requestId,message:body.message,uiLanguage:"tr",acceptedDefaults:[],websiteRevisionContext:context,approvedMaxCredits:quote.maxCredits,expectedProjectRevision:project.snapshot.revision},{store,provider,tariff,mode:"real"});
  return json(output(result,context));
 }catch(error){
  const known=error instanceof ConversationError;
  return json({ok:false,code:known?error.code:error instanceof ZodError?"invalid_request":"studio_unavailable",safeToRetryAutomatically:false,billingState:known&&error.outcome==="uncertain"?"reconciliation_required":"not_confirmed"},known?error.status:error instanceof ZodError?400:503);
 }
}

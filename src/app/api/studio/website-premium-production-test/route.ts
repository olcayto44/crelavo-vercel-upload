import {createClient} from "@supabase/supabase-js";
import {createHash} from "node:crypto";
import {z} from "zod";
import {websitePilotCanary,websitePilotProviderKey,websitePilotScope} from "@/lib/studio-agent/website-pilot-provider";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {prepareWebsiteHandoff} from "@/lib/studio-agent/website-plan-handoff";
import {normalizeAssistantWebsiteBrief,websitePlanHash,websiteEngineInput} from "@/lib/assistant-work/website-brief";
import {preparePaidWebsiteAI,generatePaidWebsiteArtifact} from "@/lib/assistant-work/website-paid-ai";
import {createWebsiteCreditLedger} from "@/lib/assistant-work/website-credit-ledger";
import {createWebsiteMediaJournal} from "@/lib/assistant-work/website-media-journal";
import {runIsolatedWebsiteGeneration} from "@/lib/assistant-work/website-atomic-runner";
import {websiteCreditDeliveryProof} from "@/lib/assistant-work/website-paid-delivery";
import {buildSettledWebsitePreview,buildSettledWebsiteCandidate} from "@/lib/website-settled-delivery";
import {WebsiteHeroMediaList} from "@/lib/website-hero-media";
import {WebsiteDesignSpec} from "@/lib/website-design-schema";
import {rateLimit} from "@/lib/security";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
const source="studio_premium_pilot_v1",uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const input=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("quote"),projectId:uuid}),
 z.strictObject({action:z.literal("submit"),projectId:uuid,quoteHash:hash,approvedCredits:z.number().int().positive(),confirmProduction:z.literal(true)}),
 z.strictObject({action:z.enum(["status","preview","zip"])})
]);
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"};
export async function POST(request:Request){
 const reply=(v:unknown,status=200)=>Response.json(v,{status,headers});
 const fail=(status:number,code:string)=>reply({ok:false,code,safeToRetryAutomatically:false},status);
 if(!websitePilotScope())return fail(404,"not_found");
 const token=bearerTokenFromRequest(request);if(!token)return fail(401,"sign_in");
 try{
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",process.env.STUDIO_AGENT_TEST_SERVICE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token),actor=auth.data.user?.id;
 if(auth.error||!actor||!(auth.data.user?.email_confirmed_at||auth.data.user?.confirmed_at)||!websitePilotCanary(actor))return fail(403,"canary_required");
 if(!rateLimit({key:"website-premium-pilot:"+actor,limit:12,windowMs:60000}).allowed)return fail(429,"rate_limit");
 const raw=await request.text();if(Buffer.byteLength(raw)>2000)return fail(413,"request_too_large");
 const parsed=input.safeParse(JSON.parse(raw));if(!parsed.success)return fail(400,"invalid_request");const v=parsed.data;
 const current=await db.from("production_requests").select("id,user_id,production_type,status,reserved_credits,output_json,estimated_credits").eq("user_id",actor).eq("production_type","website").eq("request_metadata->>source",source).maybeSingle();
 if(current.error)return fail(503,"storage_unavailable");
 const p=current.data,phase=p?.output_json?.websiteAssistant?.phase;
 const enabled=process.env.STUDIO_WEBSITE_PREMIUM_PILOT_ENABLED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&process.env.STUDIO_AGENT_PROVIDER_VERIFIED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true";
 if(v.action==="status")return reply({ok:true,enabled,state:phase??"not_started",productionId:p?.id??null,credits:p?.estimated_credits??null,completedImages:Object.values(p?.output_json?.websitePageMediaJournal??{}).filter((x:any)=>x?.state==="validated").length});
 if(v.action==="preview"||v.action==="zip"){
  if(!p||phase!=="ready")return fail(409,"settled_delivery_required");
  const r=await db.from("website_credit_reservations").select("production_id,user_id,state,credits,plan_hash").eq("production_id",p.id).eq("user_id",actor).maybeSingle();
  const plan=p.output_json?.plan,media=WebsiteHeroMediaList.parse(plan?.websiteHeroMedia),design=WebsiteDesignSpec.parse(plan?.editableDesign);
  if(r.error||!r.data||r.data.plan_hash!==p.output_json?.websiteAssistant?.planHash||!websiteCreditDeliveryProof(p,r.data)||media.length!==plan?.websitePageMediaCoverage?.required||media.length!==plan?.websitePageMediaCoverage?.delivered)return fail(409,"settled_delivery_required");
  const rows=[{productionId:p.id,designHash:plan.editableDesignHash,design,heroMedia:media}];
  if(v.action==="preview")return reply({ok:true,...buildSettledWebsitePreview(rows,p.id)});
  const zip=buildSettledWebsiteCandidate(rows,p.id).zip;
  return new Response(new Uint8Array(zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":'attachment; filename="crelavo-premium-website-pilot.zip"'}});
 }
 if(!enabled||!websitePilotProviderKey())return fail(503,"premium_pilot_disabled");
 if(p)return fail(409,"single_attempt_exists_check_status");
 const ready=await db.rpc("website_premium_pilot_ready");if(ready.error||ready.data!==true)return fail(503,"premium_database_not_ready");
 if(v.action!=="quote"&&v.action!=="submit")return fail(400,"invalid_action");
 const sourceRow=await db.from("studio_agent_projects").select("id,user_id,category_id,revision,production_id,brief").eq("id",v.projectId).eq("user_id",actor).eq("category_id","website").maybeSingle();
 if(sourceRow.error||!sourceRow.data)return fail(404,"project_not_found");
 const h=prepareWebsiteHandoff(sourceRow.data,actor);
 if(h.brief.features.length>11)return fail(422,"feature_limit");
 const brief=normalizeAssistantWebsiteBrief({...h.brief,features:[...h.brief.features.filter(x=>!/^(ai hero image|ai page images)$/i.test(x.trim())),"AI page images"]});
 const env={OPENAI_API_KEY:websitePilotProviderKey(),CRELAVO_WEBSITE_AI_HERO_ENABLED:"true",CRELAVO_WEBSITE_AI_PAGE_BATCH_ENABLED:"true"};
 const budget=preparePaidWebsiteAI(websiteEngineInput(brief),env,h.packId);
 const planHash=websitePlanHash(brief,h.packId);
 const quoteHash=createHash("sha256").update(JSON.stringify([source,actor,h.row.id,h.row.revision,planHash,h.credits,budget.maximumMicroUSD,budget.pageImageCount])).digest("hex");
 const w=await db.from("credit_balances").select("balance,reserved").eq("user_id",actor).maybeSingle();
 if(w.error||!w.data||Number(w.data.balance)-Number(w.data.reserved)<h.credits)return fail(402,"insufficient_test_credits");
 if(v.action==="quote")return reply({ok:true,quoteHash,credits:h.credits,brief,images:budget.pageImageCount,maximumMicroUSD:budget.maximumMicroUSD});
 if(v.quoteHash!==quoteHash||v.approvedCredits!==h.credits)return fail(409,"quote_changed");
 // The unique database fence allows just one new paid-provider attempt in this
 // isolated environment. No reuse of production credentials, no implicit retry.
 const created=await db.from("production_requests").insert({user_id:actor,production_type:"website",package_id:h.packId,title:brief.brand+" premium pilot",prompt:brief.brief,status:"pending",generation_status:"pending",estimated_credits:h.credits,reserved_credits:0,input_json:{websiteBrief:brief},request_metadata:{source,assistantProjectId:h.row.id,assistantRevision:h.row.revision,maximumMicroUSD:budget.maximumMicroUSD},output_json:{websiteAssistant:{brief,phase:"approved",planHash,approvedHash:planHash,packId:h.packId,credits:h.credits,messages:[]}}}).select("id").single();
 if(created.error||!created.data)return fail(409,"single_attempt_unconfirmed_check_status");
 const productionId=created.data.id,identity={userId:actor,productionId,planHash};
 const rpc=async(name:string,args:Record<string,unknown>)=>{const r=await db.rpc(name,args);return {data:r.data,error:r.error};};
 const ledger=createWebsiteCreditLedger(rpc),journal=createWebsiteMediaJournal(identity,rpc);
 const result=await runIsolatedWebsiteGeneration({...identity,credits:h.credits},{ledger,remoteGeneration:true,generate:(input,id,pack)=>generatePaidWebsiteArtifact(input,id,pack,journal,env),loadReserved:async(id,user)=>{
  const r=await db.from("production_requests").select("id,user_id,output_json").eq("id",id).eq("user_id",user).eq("request_metadata->>source",source).maybeSingle();
  if(r.error||!r.data)throw Error("storage");
  const a=r.data.output_json?.websiteAssistant;
  return {productionId:r.data.id,userId:r.data.user_id,phase:a?.phase,planHash:a?.planHash,approvedHash:a?.approvedHash,packId:a?.packId,credits:a?.credits,brief:a?.brief};
 }});
 return reply({ok:result.state==="ready",state:result.state,productionId,completedImages:result.state==="ready"?budget.pageImageCount:undefined,safeToRetryAutomatically:false},result.state==="ready"?200:409);
 }catch{return fail(503,"premium_pilot_outcome_unconfirmed");}
}

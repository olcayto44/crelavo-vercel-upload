// Isolated one-shot worker; intentionally not an automatic production service.
// No provider or DB access on a disabled/unconfigured invocation.
const {load}=require("./studio-agent-test-loader.cjs");
const {createClient}=require("@supabase/supabase-js");
const {isolatedDatabaseTarget}=load("src/lib/studio-agent/environment-policy.ts");
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const enabled=()=>process.env.STUDIO_AGENT_TEST_DATABASE_URL===origin&&process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN===origin&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_WEBSITE_AI_WORKER_ENABLED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&process.env.STUDIO_AGENT_PROVIDER_VERIFIED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true"&&process.env.VERCEL_ENV!=="production"&&isolatedDatabaseTarget()&&!!process.env.STUDIO_AGENT_TEST_PROVIDER_KEY?.trim()&&!!process.env.STUDIO_WEBSITE_AI_TEST_USER_ID;
(async()=>{
 if(!enabled()){console.log("website-ai-worker: disabled");return;}
 const {readCostPolicy}=load("src/lib/studio-agent/cost-policy.ts");
 const {runWebsiteAIWorkerOnce}=load("src/lib/studio-agent/website-ai-worker.ts");
 const db=createClient(process.env.STUDIO_AGENT_TEST_DATABASE_URL,process.env.STUDIO_AGENT_TEST_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const one=async query=>{const {data,error}=await query;if(error)throw Error("isolated_storage_unavailable");return data;};
 const policy=readCostPolicy(),{websiteAIPolicyDigest}=load("src/lib/studio-agent/website-ai-orchestrator.ts"),digest=websiteAIPolicyDigest(policy);
 const activation=()=>one(db.from("website_ai_activation").select("policy_version,policy_hash,maximum_micro_usd,total_micro_usd,user_rpm,system_rpm,enabled,auto_metered_settlement").eq("singleton",true).maybeSingle());
 const first=await activation(),autoMeteredSettlement=first?.auto_metered_settlement===true;
 const matches=p=>!!p&&p.enabled===true&&p.auto_metered_settlement===autoMeteredSettlement&&p.policy_version===policy.version&&p.policy_hash===digest&&p.maximum_micro_usd===policy.requestMicroUSD&&p.total_micro_usd===policy.totalMicroUSD&&p.user_rpm===policy.userRPM&&p.system_rpm===policy.systemRPM;
 if(!matches(first)){console.log("website-ai-worker: policy unavailable");return;}
 const result=await runWebsiteAIWorkerOnce({enabled,policy,autoMeteredSettlement,policyMatches:async()=>matches(await activation()),apiKey:process.env.STUDIO_AGENT_TEST_PROVIDER_KEY,testUserId:process.env.STUDIO_WEBSITE_AI_TEST_USER_ID,
  loadNext:(u,h)=>one(db.from("website_ai_jobs").select("production_id,user_id,plan_hash,policy_version,policy_hash,credits,maximum_micro_usd,state").eq("user_id",u).eq("policy_hash",h).eq("state","queued").order("updated_at",{ascending:true}).order("production_id",{ascending:true}).limit(1).maybeSingle()),
  loadProject:(u,id)=>one(db.from("production_requests").select("id,user_id,production_type,output_json").eq("id",id).eq("user_id",u).eq("production_type","website").maybeSingle()),
  rpc:(name,args)=>db.rpc(name,args)});
 console.log("website-ai-worker:",result.state);
 if(result.state==="reconciliation_required")process.exitCode=1;
})().catch(()=>{console.error("website-ai-worker: configuration or execution unconfirmed");process.exitCode=1;});

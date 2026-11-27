// Read-only connection verification, only for the explicit commercial preview.
// Never print keys, account identifiers, responses, database contents or provider prompts.
const {createClient}=require("@supabase/supabase-js");
const {load}=require("./studio-agent-test-loader.cjs");
const branch="feat/studio-stage-image-20261127",origin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
async function main(){
 const e=process.env;
 if(e.VERCEL_ENV!=="preview"||e.VERCEL_GIT_COMMIT_REF!==branch||e.STUDIO_WEBSITE_CONNECTION_PREFLIGHT!=="true")return;
 if(e.STUDIO_AGENT_DATABASE_TARGET!=="isolated"||e.STUDIO_AGENT_TEST_DATABASE_URL!==origin||e.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==origin||e.STUDIO_AGENT_TEST_OFFLINE!=="true"||e.STUDIO_AGENT_REAL_AI_ENABLED!=="false"||e.STUDIO_WEBSITE_AI_WORKER_ENABLED!=="false"||e.STUDIO_WEBSITE_AI_LAUNCH_ENABLED!=="false"||e.STUDIO_IMAGE_LAUNCH_ENABLED!=="false")throw Error("unsafe_configuration");
 const key=e.STUDIO_AGENT_TEST_SERVICE_KEY?.trim(),provider=e.STUDIO_AGENT_TEST_PROVIDER_KEY?.trim(),actor=e.STUDIO_WEBSITE_AI_TEST_USER_ID;
 if(!key||!provider||!actor||!(/^[a-f0-9-]{36}$/i).test(actor))throw Error("missing_credentials");
 const db=createClient(origin,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,redirect:"error",signal:AbortSignal.timeout(10000)})}});
 const {readCostPolicy}=load("src/lib/studio-agent/cost-policy.ts");
 const {websiteAIPolicyDigest}=load("src/lib/studio-agent/website-ai-orchestrator.ts");
 const p=readCostPolicy(),digest=websiteAIPolicyDigest(p);
 const a=await db.from("website_ai_activation").select("enabled,policy_version,policy_hash,maximum_micro_usd,total_micro_usd,user_rpm,system_rpm").eq("singleton",true).maybeSingle();
 if(a.error||!a.data||a.data.enabled!==true||a.data.policy_version!==p.version||a.data.policy_hash!==digest||a.data.maximum_micro_usd!==p.requestMicroUSD||a.data.total_micro_usd!==p.totalMicroUSD||a.data.user_rpm!==p.userRPM||a.data.system_rpm!==p.systemRPM)throw Error("database_policy_mismatch");
 const auth=await db.auth.admin.getUserById(actor);
 if(auth.error||auth.data.user?.id!==actor||!auth.data.user.email_confirmed_at)throw Error("test_owner_unverified");
 const w=await db.from("credit_balances").select("balance,reserved").eq("user_id",actor).single();
 if(w.error||!w.data||w.data.balance-w.data.reserved<500)throw Error("test_wallet_unavailable");
 for(const [table,column] of [["website_ai_jobs","production_id"],["website_credit_reservations","production_id"],["production_requests","id"],["website_cms_design_drafts","site_id"]]){
  const r=await db.from(table).select(column,{head:true,count:"exact"}).limit(0);
  if(r.error)throw Error("database_permission_unverified");
 }
 console.log("website-commercial-preflight: isolated DB, verified test owner, test wallet and cost policy OK");
 for(const model of ["gpt-6.1-terra","gpt-image-2.6-flare"]){
  const r=await fetch("https://api.openai.com/v1/models/"+model,{headers:{Authorization:"Bearer "+provider},redirect:"error",signal:AbortSignal.timeout(10000)});
  if(!r.ok){console.log("website-commercial-preflight: "+model+" metadata HTTP "+r.status);await r.body?.cancel();throw Error("provider_model_unverified");}
  if((await r.json())?.id!==model)throw Error("provider_model_mismatch");
  console.log("website-commercial-preflight: "+model+" metadata OK");
 }
 console.log("website-commercial-preflight: PASS; no inference, no wallet changes, no customer payment");
}
main().catch(e=>{const allowed=["unsafe_configuration","missing_credentials","database_policy_mismatch","test_owner_unverified","test_wallet_unavailable","database_permission_unverified","provider_model_unverified","provider_model_mismatch"];console.error("website-commercial-preflight:",allowed.includes(e?.message)?e.message:"connection_unverified");process.exitCode=1;});

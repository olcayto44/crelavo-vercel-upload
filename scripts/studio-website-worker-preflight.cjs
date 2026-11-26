// One-shot, no generation, no wallet mutation, no secret output.
const {createClient}=require("@supabase/supabase-js");
async function main(){
 const e=process.env, expected="https://bwzxdxqgrgbsvndinmrv.supabase.co";
 if(e.STUDIO_AGENT_TEST_DATABASE_URL!==expected||e.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==expected||e.STUDIO_AGENT_DATABASE_TARGET!=="isolated"||e.STUDIO_WEBSITE_AI_WORKER_ENABLED!=="false"||e.STUDIO_AGENT_REAL_AI_ENABLED!=="false"||e.STUDIO_AGENT_TEST_OFFLINE!=="true")throw Error("unsafe_configuration");
 const key=e.STUDIO_AGENT_TEST_SERVICE_KEY,provider=e.STUDIO_AGENT_TEST_PROVIDER_KEY;
 if(!key||!provider)throw Error("missing_credentials");
 const db=createClient(expected,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,redirect:"error",signal:AbortSignal.timeout(10000)})}});
 for(const table of ["website_ai_jobs","website_credit_reservations","production_requests"]){
  const r=await db.from(table).select(table==="production_requests"?"id":"production_id",{head:true,count:"exact"}).limit(0);
  if(r.error)throw Error("database_permission_unverified");
 }
 console.log("website-worker-preflight: isolated privileged reads OK");
 const r=await fetch("https://api.openai.com/v1/models/gpt-6.1-terra",{headers:{Authorization:"Bearer "+provider},redirect:"error",signal:AbortSignal.timeout(10000)});
 if(!r.ok){console.log("website-worker-preflight: model metadata HTTP "+r.status);throw Error("provider_model_unverified");}
 const model=await r.json();if(model.id!=="gpt-6.1-terra")throw Error("provider_model_mismatch");
 console.log("website-worker-preflight: OpenAI model metadata OK; no inference performed");
}
main().catch(e=>{const allowed=["unsafe_configuration","missing_credentials","database_permission_unverified","provider_model_unverified","provider_model_mismatch"];console.error("website-worker-preflight:",allowed.includes(e.message)?e.message:"connection_unverified");process.exitCode=1;});

// Read-only check of the isolated backend key. No user records, writes, inference, or key output.
const BRANCH="feat/central-production-dispatch-20261125";
const ORIGIN="https://bwzxdxqgrgbsvndinmrv.supabase.co";
async function probe(env,transport=fetch){
 if(env.VERCEL_ENV!=="preview"||env.VERCEL_GIT_COMMIT_REF!==BRANCH)return "skipped";
 if(env.STUDIO_AGENT_TEST_DATABASE_URL!==ORIGIN||env.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==ORIGIN||env.STUDIO_AGENT_DATABASE_TARGET!=="isolated")return "isolated_target_mismatch";
 const key=env.STUDIO_AGENT_TEST_SERVICE_KEY;
 if(!key?.trim())return "service_key_missing";
 if(!key.startsWith("sb_secret_")&&!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))return "service_key_format_unconfirmed";
 try{
 const r=await transport(ORIGIN+"/rest/v1/website_ai_activation?select=policy_version,enabled&singleton=eq.true&limit=1",{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),headers:{apikey:key,Accept:"application/json"}});
 if(!r.ok){await r.body?.cancel().catch(()=>{});return r.status===401||r.status===403?"service_access_rejected":"database_unavailable";}
 const reader=r.body?.getReader();if(!reader)return "response_unconfirmed";
 let size=0,body="";const decoder=new TextDecoder();
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096)return "response_unconfirmed";body+=decoder.decode(value,{stream:true});}body+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 const rows=JSON.parse(body);
 return Array.isArray(rows)&&rows.length===1&&rows[0].policy_version==="website-pilot-20261126-v1"&&rows[0].enabled===false?"isolated_service_access_verified_policy_disabled":"policy_unconfirmed";
 }catch{return "database_unavailable";}
}
module.exports={probe};
if(require.main===module)probe(process.env).then(v=>console.log("Website isolated Supabase connection: "+v+" (read-only, no credentials logged)"));

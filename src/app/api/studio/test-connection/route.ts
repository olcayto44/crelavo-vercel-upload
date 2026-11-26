// Non-privileged read-only connectivity check for the designated isolated preview.
export const dynamic="force-dynamic";
export const runtime="nodejs";
const expected="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(){
 const e=process.env;
 if(e.VERCEL_ENV!=="preview"||!["feat/central-production-dispatch-20261125","release/commercial-five-track-20261126"].includes(e.VERCEL_GIT_COMMIT_REF||"")||e.STUDIO_WEBSITE_TEST_CONNECTION_ENABLED!=="true")return json({ok:false,code:"disabled"},404);
 const key=e.STUDIO_AGENT_TEST_PUBLISHABLE_KEY||"";
 if(e.STUDIO_AGENT_TEST_DATABASE_URL!==expected||e.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==expected||!key.startsWith("sb_publishable_"))return json({ok:false,code:"configuration_unverified"},503);
 try{
 const r=await fetch(expected+"/rest/v1/rpc/website_test_connection_probe",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(5000),redirect:"error",cache:"no-store"});
 if(!r.ok||await r.json()!=="crelavo-isolated-website-v1")return json({ok:false,code:"connection_unverified"},503);
 return json({ok:true,target:"isolated",databaseConnected:true,probe:"read_only",privilegedProductionVerified:false,providerVerified:false});
 }catch{return json({ok:false,code:"connection_unverified"},503);}
}

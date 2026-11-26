// Explicit read-only model metadata diagnostic. Does not enable production or copy credentials.
// No prompts, inference, database writes, key output, redirects or retries.
const BRANCH="feat/central-production-dispatch-20261125";
const MODEL="gpt-6.1-terra";
async function probe(env,transport=fetch,model=MODEL){
 if(![MODEL,"gpt-image-2.6-flare"].includes(model))return "skipped";
 if(env.VERCEL_ENV!=="preview"||env.VERCEL_GIT_COMMIT_REF!==BRANCH||env.STUDIO_WEBSITE_EXISTING_OPENAI_METADATA_CHECK!=="true")return "skipped";
 const key=env.OPENAI_API_KEY;
 if(typeof key!=="string"||!key.trim())return "preview_key_unavailable";
 try{
 const r=await transport("https://api.openai.com/v1/models/"+model,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000),headers:{Authorization:"Bearer "+key.trim()}});
 if(!r.ok){if(r.body)await r.body.cancel().catch(()=>{});return r.status===401?"credential_rejected":r.status===403||r.status===404?"model_access_unconfirmed":"provider_unavailable";}
 const reader=r.body?.getReader();if(!reader)return "metadata_unconfirmed";
 let bytes=0,body="";const decoder=new TextDecoder();
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>16384)return "metadata_unconfirmed";body+=decoder.decode(value,{stream:true});}body+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 const v=JSON.parse(body);
 return v?.object==="model"&&v.id===model?"model_metadata_verified":"metadata_unconfirmed";
 }catch{return "provider_unavailable";}
}
module.exports={probe};
if(require.main===module)(async()=>{for(const model of [MODEL,"gpt-image-2.6-flare"])console.log("Website existing OpenAI preview metadata check ["+model+"]: "+await probe(process.env,fetch,model)+" (no inference, no credential output)");})();

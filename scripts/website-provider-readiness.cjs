// Read-only provider probe: no completions, no tokens/response bodies printed.
(async()=>{
 const key=process.env.OPENAI_API_KEY?.trim();
 const model=process.env.OPENAI_WEBSITE_MODEL||process.env.OPENAI_ASSISTANT_MODEL||'gpt-4o-mini';
 if(!key){console.log(JSON.stringify({keyPresent:false}));process.exitCode=1;return;}
 const r=await fetch('https://api.openai.com/v1/models/'+encodeURIComponent(model),{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+key}});
 let data;try{data=await r.json();}catch{}
 const allowedCodes=['invalid_api_key','model_not_found','insufficient_quota','rate_limit_exceeded','permission_denied'];
 console.log(JSON.stringify({keyPresent:true,readOnlyProbe:true,httpStatus:r.status,modelAvailable:r.ok,providerCode:allowedCodes.includes(data?.error?.code)?data.error.code:null}));
 if(!r.ok)process.exitCode=1;
})().catch(()=>{console.log(JSON.stringify({readOnlyProbe:true,networkFailed:true}));process.exitCode=1;});

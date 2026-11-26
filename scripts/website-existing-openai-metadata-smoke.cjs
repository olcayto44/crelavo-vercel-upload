const assert=require("node:assert/strict");
const {probe}=require("./website-existing-openai-metadata-check.cjs");
(async()=>{
 const env={VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/central-production-dispatch-20261125",STUDIO_WEBSITE_EXISTING_OPENAI_METADATA_CHECK:"true",OPENAI_API_KEY:"synthetic-only"};
 let calls=0;
 const transport=async(url,init)=>{calls++;assert.equal(url,"https://api.openai.com/v1/models/gpt-6.1-terra");assert.equal(init.method,"GET");assert.equal(init.redirect,"error");assert.equal(init.headers.Authorization,"Bearer synthetic-only");assert.equal(init.body,undefined);return Response.json({object:"model",id:"gpt-6.1-terra"});};
 assert.equal(await probe({...env,VERCEL_ENV:"production"},transport),"skipped");
 assert.equal(await probe({...env,VERCEL_GIT_COMMIT_REF:"main"},transport),"skipped");
 assert.equal(await probe({...env,STUDIO_WEBSITE_EXISTING_OPENAI_METADATA_CHECK:"false"},transport),"skipped");
 assert.equal(await probe({...env,OPENAI_API_KEY:""},transport),"preview_key_unavailable");assert.equal(calls,0);
 assert.equal(await probe(env,transport),"model_metadata_verified");assert.equal(calls,1);
 assert.equal(await probe(env,async()=>Response.json({error:"private fixture"},{status:401})),"credential_rejected");
 assert.equal(await probe(env,async()=>Response.json({object:"model",id:"other"})),"metadata_unconfirmed");
 assert.equal(await probe(env,async()=>{throw Error("private fixture")}),"provider_unavailable");
 assert.equal(env.OPENAI_API_KEY,"synthetic-only");assert.equal(env.STUDIO_AGENT_TEST_PROVIDER_KEY,undefined);
 console.log("website existing provider metadata probe: exact preview scope, GET-only, secret redaction, no inference or key alias");
})().catch(e=>{console.error(e);process.exitCode=1;});

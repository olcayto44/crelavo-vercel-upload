const assert=require("node:assert/strict");const {probe}=require("./website-test-supabase-connection-check.cjs");
(async()=>{
 const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",env={VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/central-production-dispatch-20261125",STUDIO_AGENT_DATABASE_TARGET:"isolated",STUDIO_AGENT_TEST_DATABASE_URL:origin,STUDIO_AGENT_TEST_DATABASE_ORIGIN:origin,STUDIO_AGENT_TEST_SERVICE_KEY:"sb_secret_fixture"};
 let calls=0;const transport=async(url,init)=>{calls++;assert(url.startsWith(origin+"/rest/v1/website_ai_activation?"));assert.equal(init.method,"GET");assert.equal(init.redirect,"error");assert.equal(init.headers.apikey,"sb_secret_fixture");assert.equal(init.body,undefined);return Response.json([{policy_version:"website-pilot-20261126-v1",enabled:false}]);};
 assert.equal(await probe({...env,VERCEL_ENV:"production"},transport),"skipped");
 assert.equal(await probe({...env,STUDIO_AGENT_TEST_DATABASE_URL:"https://other.supabase.co"},transport),"isolated_target_mismatch");
 assert.equal(await probe({...env,STUDIO_AGENT_TEST_SERVICE_KEY:"sb_publishable_fixture"},transport),"service_key_format_unconfirmed");assert.equal(calls,0);
 assert.equal(await probe(env,transport),"isolated_service_access_verified_policy_disabled");assert.equal(calls,1);
 assert.equal(await probe(env,async()=>Response.json({},{status:401})),"service_access_rejected");
 assert.equal(await probe(env,async()=>Response.json([])),"policy_unconfirmed");
 assert.equal(await probe(env,async()=>Response.json([{policy_version:"website-pilot-20261126-v1",enabled:true}])),"policy_unconfirmed");
 console.log("Website isolated Supabase diagnostic smoke: exact target, read-only, disabled policy, no key logging");
})().catch(e=>{console.error(e);process.exitCode=1;});

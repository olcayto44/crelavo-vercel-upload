const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
(async()=>{
 const prior={ADMIN_EMAIL:process.env.ADMIN_EMAIL,ADMIN_API_TOKEN:process.env.ADMIN_API_TOKEN};
 let dbCalls=0;
 const guard=load("src/lib/admin-guard.ts",{"@/lib/admin-session":{ADMIN_SESSION_COOKIE:"test_session",getAdminSessionPayload:x=>x==="owner-fixture"?{email:"owner@example.test"}:null,getCookieValue:x=>x?.split("=")[1]},"@/lib/supabase":{supabaseAdmin(){dbCalls++;throw Error("No database call allowed")}}});
 const req=(headers={},url="https://example.test/api/admin")=>new Request(url,{headers});
 try{
 process.env.ADMIN_EMAIL="owner@example.test";delete process.env.ADMIN_API_TOKEN;
 assert.equal(guard.isAdminRequest(req({"x-admin-email":"owner@example.test"})),false);
 assert.equal((await guard.getAdminRequestContext(req({"x-admin-email":"owner@example.test"}))).ok,false);
 assert.equal((await guard.getAdminRequestContext(req({"x-admin-email":"other@example.test"}))).ok,false);
 assert.equal(guard.isAdminRequest(req({cookie:"test_session=owner-fixture"})),true);
 assert.equal((await guard.getAdminRequestContext(req({cookie:"test_session=owner-fixture"}))).ok,true);
 process.env.ADMIN_API_TOKEN="synthetic-only";
 assert.equal(guard.isAdminRequest(req({"x-admin-email":"owner@example.test","x-admin-api-token":"wrong"})),false);
 assert.equal(guard.isAdminRequest(req({"x-admin-email":"owner@example.test","x-admin-api-token":"synthetic-only"})),true);
 assert.equal((await guard.getAdminRequestContext(req({"x-admin-email":"owner@example.test","x-admin-api-token":"synthetic-only"}))).ok,true);
 assert.equal(dbCalls,0);
 console.log("admin owner guard: signed owner session or matching secret required, anonymous header denied, no live DB");
 }finally{for(const [k,v] of Object.entries(prior)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
})().catch(e=>{console.error(e);process.exitCode=1;});

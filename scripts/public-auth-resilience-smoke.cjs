const fs=require("node:fs"),assert=require("node:assert/strict"),ts=require("typescript");
const source=fs.readFileSync("src/lib/auth-guards.ts","utf8");
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function load(client){const exports={};new Function("require","exports",code)(id=>{assert.equal(id,"@/lib/supabase");return {supabaseBrowser:client}},exports);return exports;}
(async()=>{
 const unavailable=await load(()=>{throw Error("missing public configuration")}).requireVerifiedBrowserUser();assert.equal(unavailable.ok,false);
 const rejected=await load(()=>({auth:{getUser:async()=>{throw Error("network")},getSession:async()=>({data:{session:null}})}})).requireVerifiedBrowserUser();assert.equal(rejected.ok,false);
 const unverified=await load(()=>({auth:{getUser:async()=>({data:{user:{id:"test"}}}),getSession:async()=>({data:{session:null}})}})).requireVerifiedBrowserUser();assert.equal(unverified.ok,false);
 const verified=await load(()=>({auth:{getUser:async()=>({data:{user:{id:"test",email_confirmed_at:"test"}}}),getSession:async()=>({data:{session:{access_token:"test-only"}}})}})).requireVerifiedBrowserUser();assert.equal(verified.ok,true);
 console.log("public-auth-resilience-smoke ok: unavailable auth fails closed; verified session still works");
})().catch(error=>{console.error(error);process.exitCode=1});

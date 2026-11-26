const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {handleProductionStatus}=load("src/lib/studio-agent/production-status.ts");
const user="11111111-1111-4111-8111-111111111111",project="22222222-2222-4222-8222-222222222222",id="33333333-3333-4333-8333-333333333333",hash="a".repeat(64),now=Date.parse("2026-11-25T15:00:00Z");
const b={id:project,user_id:user,category_id:"website",production_id:id},base={id,user_id:user,production_type:"website",status:"pending",generation_status:"pending",reserved_credits:0,estimated_credits:500,updated_at:new Date(now).toISOString(),output_json:{websiteAssistant:{phase:"approved",planHash:hash,approvedHash:hash}}};
const h={production_id:id,user_id:user,plan_hash:hash,credits:500,state:"reserved"};
const phase=(phase,extra={},output={})=>({...base,...extra,output_json:{websiteAssistant:{...base.output_json.websiteAssistant,phase},...output}});
const deps={authenticate:async()=>user,loadBinding:async(u,p)=>{assert.equal(u,user);assert.equal(p,project);return b;},loadProduction:async(u,p)=>{assert.equal(u,user);assert.equal(p,id);return base;},loadReservation:async()=>null,now:()=>now};
const get=(d=deps,q="projectId="+project)=>handleProductionStatus(new Request("https://example.test/status?"+q),d);
(async()=>{
 assert.equal((await get({...deps,authenticate:async()=>null})).status,401);
 assert.equal((await get({...deps,loadBinding:async()=>({...b,user_id:id})})).status,404);
 assert.equal((await get(deps,"projectId="+project+"&projectId="+project)).status,400);
 assert.equal((await get({...deps,loadReservation:async()=>{throw Error("offline");}})).status,503);
 const ready=phase("ready",{status:"ready",generation_status:"completed"},{websiteBillingMode:"atomic_v1",websiteBillingPending:false,charged:500,websiteFiles:[{path:"index.html",content:"<html>ok</html>"}]});
 for(const [p,res,expected] of [
 [base,null,"approved"],[phase("reserved",{reserved_credits:500}),h,"credits_reserved"],
 [phase("generating",{status:"in_production",generation_status:"provider_generating",reserved_credits:500}),h,"generating"],
 [phase("awaiting_payment",{status:"in_production",generation_status:"completed",reserved_credits:500}),h,"settlement_pending"],
 [ready,{...h,state:"settled"},"ready"],[ready,h,"reconciliation_required"],[ready,{...h,state:"settled",plan_hash:"b".repeat(64)},"reconciliation_required"],
 [{...ready,output_json:{...ready.output_json,websiteFiles:[]}},{...h,state:"settled"},"reconciliation_required"],
 [phase("generation_failed",{status:"failed",generation_status:"failed"}),{...h,state:"released"},"failed_released"],
 [phase("generating",{status:"in_production",generation_status:"provider_generating",reserved_credits:500,updated_at:"2026-11-25T14:00:00Z"}),h,"reconciliation_required"],
 [base,{...h,user_id:id},"reconciliation_required"]
 ]){const response=await get({...deps,loadProduction:async()=>p,loadReservation:async()=>res});assert.equal(response.status,200);const out=await response.json();assert.equal(out.stage,expected);assert.equal(out.deliveryAvailable,expected==="ready");assert.equal(out.safeToRetryAutomatically,false);assert.equal(Boolean(out.deliveryZipUrl),expected==="ready");assert(!("percent" in out));assert(!("output_json" in out));}
 console.log("studio-production-status-smoke ok: owner, recorded stages, settled delivery, stale/uncertain holds, no retry (offline)");
})().catch(e=>{console.error(e);process.exitCode=1;});

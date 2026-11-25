const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {handleProductionDispatch}=load("src/lib/studio-agent/production-dispatch.ts");
const userId="11111111-1111-4111-8111-111111111111",projectId="22222222-2222-4222-8222-222222222222",productionId="33333333-3333-4333-8333-333333333333",planHash="a".repeat(64);
const input={categoryId:"website",projectId,planHash,confirmProduction:true};
const studio={id:projectId,user_id:userId,category_id:"website",production_id:productionId};
const website={id:productionId,user_id:userId,production_type:"website",status:"pending",output_json:{websiteAssistant:{phase:"approved",planHash,approvedHash:planHash}}};
let calls=0;
const deps={authenticate:async()=>userId,loadStudio:async(u,p)=>{assert.equal(u,userId);assert.equal(p,projectId);return studio;},loadWebsite:async(u,p)=>{assert.equal(u,userId);assert.equal(p,productionId);return website;},adapter:{enabled:()=>true,execute:async(raw,actor)=>{calls++;assert.deepEqual(raw,{productionId,planHash});assert.deepEqual(actor,{id:userId});return {status:200,payload:{ok:true,state:"ready",productionId,charged:30,previewUrl:"/api/productions/"+productionId+"/delivery?file=preview",deliveryZipUrl:"/api/productions/"+productionId+"/delivery?file=zip"}};}}};
const run=(body=input,d=deps)=>handleProductionDispatch(new Request("https://example.test/api/studio/production",{method:"POST",body:JSON.stringify(body)}),d);
(async()=>{
 for(const [body,d,status] of [
 [input,{...deps,authenticate:async()=>null},401],
 [input,{...deps,adapter:{...deps.adapter,enabled:()=>false}},503],
 [{...input,confirmProduction:false},deps,400],
 [{...input,categoryId:"video"},deps,400],
 [{...input,userId},deps,400],
 [{...input,productionId},deps,400],
 [input,{...deps,loadStudio:async()=>({...studio,user_id:productionId})},404],
 [input,{...deps,loadStudio:async()=>({...studio,production_id:null})},404],
 [input,{...deps,loadWebsite:async()=>({...website,user_id:productionId})},404],
 [input,{...deps,loadWebsite:async()=>({...website,output_json:{websiteAssistant:{phase:"mock_approved",planHash,approvedHash:planHash}}})},409],
 [{...input,planHash:"b".repeat(64)},deps,409],
 [input,{...deps,loadStudio:async()=>{throw Error("offline")}},503]
 ]){const r=await run(body,d);assert.equal(r.status,status);assert.equal((await r.json()).ok,false);}
 assert.equal(calls,0);
 const ready=await run();assert.equal(ready.status,200);assert.equal((await ready.json()).chargedCredits,30);assert.equal(calls,1);
 const unknown=await run(input,{...deps,adapter:{...deps.adapter,execute:async()=>{calls++;throw Error("timeout");}}});
 assert.equal(unknown.status,409);assert.equal((await unknown.json()).state,"reconciliation_required");assert.equal(calls,2);
 console.log("studio-production-dispatch-smoke ok: verified owner, persisted approval, explicit confirmation, disabled gates, one dispatch, no retry (offline)");
})().catch(e=>{console.error(e);process.exitCode=1;});

const assert=require("node:assert/strict");
const {load}=require("./studio-agent-test-loader.cjs");
const {centralWebsiteAdapterEnabled,dispatchWebsiteAdapter}=load("src/lib/studio-agent/production-adapter.ts");
const userId="11111111-1111-4111-8111-111111111111",studioProjectId="22222222-2222-4222-8222-222222222222",productionId="33333333-3333-4333-8333-333333333333",planHash="a".repeat(64);
const action={tool:"generate_website",args:{planHash}};
const context={source:"verified_server",userId,categoryId:"website",projectId:studioProjectId,ownerUserId:userId,scopes:["produce"],creditAccount:"production",currentPlanHash:planHash,approval:{projectId:studioProjectId,categoryId:"website",planHash,account:"production",source:"explicit_user_confirmation"},confirmedRestoreRevision:null,ownedMaterialIds:[]};
const binding={userId,studioProjectId,productionId,categoryId:"website",planHash,approvalSource:"persisted_website_approval"};
const previewUrl="/api/productions/"+productionId+"/delivery?file=preview",deliveryZipUrl="/api/productions/"+productionId+"/delivery?file=zip";
const ready={status:200,payload:{ok:true,state:"ready",productionId,charged:500,previewUrl,deliveryZipUrl}};
(async()=>{
 const base={VERCEL_ENV:"production",STUDIO_V2_WEBSITE_ADAPTER_ENABLED:"true"};
 assert(centralWebsiteAdapterEnabled(base));
 for(const env of [{},{...base,VERCEL_ENV:"preview"},{...base,STUDIO_V2_WEBSITE_ADAPTER_ENABLED:"false"},{...base,STUDIO_AGENT_ISOLATED_PREVIEW:"true"}])assert(!centralWebsiteAdapterEnabled(env));
 let calls=0;
 const execute=async(raw,user)=>{calls++;assert.deepEqual(raw,{productionId,planHash});assert.deepEqual(user,{id:userId});return ready;};
 const deps={enabled:()=>true,execute};
 const dispatch=(a=action,c=context,b=binding,d=deps)=>dispatchWebsiteAdapter(a,c,b,d);
 assert.equal((await dispatch(action,context,binding,{...deps,enabled:()=>false})).state,"not_dispatched");
 for(const [a,c,b] of [
 [action,{...context,source:"client"},binding],
 [action,{...context,approval:null},binding],
 [action,{...context,creditAccount:"assistant"},binding],
 [action,{...context,scopes:["read"]},binding],
 [action,{...context,ownerUserId:productionId},binding],
 [action,{...context,currentPlanHash:"b".repeat(64)},binding],
 [action,context,{...binding,approvalSource:"mock"}],
 [action,context,{...binding,studioProjectId:productionId}],
 [{tool:"get_category_capabilities",args:{categoryId:"website"}},context,binding],
 ])assert.equal((await dispatch(a,c,b)).state,"not_dispatched");
 assert.equal(calls,0);
 assert.deepEqual(await dispatch(),{state:"ready",productionId,chargedCredits:500,previewUrl,deliveryZipUrl,safeToRetryAutomatically:false});
 assert.equal(calls,1);
 const outcomes=[
 [{status:200,payload:{ok:true,state:"already_ready",productionId,charged:0}},"already_ready"],
 [{status:502,payload:{ok:false,state:"generation_failed",code:"website_generation_failed_credits_released"}},"failed_released"],
 [{status:503,payload:{ok:false,code:"website_atomic_production_not_enabled"}},"not_dispatched"],
 [{status:409,payload:{ok:false,code:"website_generation_reconciliation_required"}},"reconciliation_required"],
 [{status:200,payload:{...ready.payload,previewUrl:"https://example.test/fake"}},"reconciliation_required"],
 [{status:200,payload:{...ready.payload,charged:0}},"reconciliation_required"],
 [{status:200,payload:{...ready.payload,productionId:studioProjectId}},"reconciliation_required"],
 ];
 for(const [response,state] of outcomes){let n=0;const r=await dispatch(action,context,binding,{enabled:()=>true,execute:async()=>{n++;return response;}});assert.equal(r.state,state);assert.equal(r.safeToRetryAutomatically,false);assert.equal(n,1);}
 let n=0;const uncertain=await dispatch(action,context,binding,{enabled:()=>true,execute:async()=>{n++;throw Error("timeout");}});
 assert.equal(uncertain.state,"reconciliation_required");assert.equal(n,1);
 const fs=require("node:fs");
 const runner=fs.readFileSync("src/lib/assistant-work/website-atomic-runner.ts","utf8");
 assert(runner.includes('released.state !== "released"'));
 const server=fs.readFileSync("src/lib/studio-agent/production-adapter-server.ts","utf8");
 assert(server.includes("executePaidWebsiteProduction")&&server.includes('import "server-only"'));
 console.log("studio-production-adapter-smoke ok: blocked gates, owner/plan binding, exact delivery, settlement evidence, no retry or fallback (offline)");
})().catch(e=>{console.error(e);process.exitCode=1;});

const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
function load(path,mocks={}){const exports={};const js=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function("require","exports",js)(id=>id in mocks?mocks[id]:require(id),exports);return exports;}
(async()=>{
 const signature=load("src/lib/assistant-work/plan-signature.ts");
 const oldSecret=process.env.ASSISTANT_PLAN_SIGNING_SECRET;process.env.ASSISTANT_PLAN_SIGNING_SECRET="offline-test-secret-with-at-least-32-characters";
 const payload={userId:"owner",plan:{reply:"Review",visualDirection:"Visual",spokenScript:"Exact spoken text"},revisionSeq:1,credits:10};
 const signed=signature.signAssistantPlan(payload);assert(signature.verifyAssistantPlan(payload,signed));assert(!signature.verifyAssistantPlan({...payload,credits:0},signed));assert(!signature.verifyAssistantPlan({...payload,userId:"other"},signed));assert(!signature.verifyAssistantPlan(payload,"bad"));assert.equal(signature.canonicalPlan({b:2,a:1}),signature.canonicalPlan({a:1,b:2}));
 if(oldSecret===undefined)delete process.env.ASSISTANT_PLAN_SIGNING_SECRET;else process.env.ASSISTANT_PLAN_SIGNING_SECRET=oldSecret;
 const storage=load("src/lib/assistant-work/storage-ownership.ts");
 assert.deepEqual(storage.parseAssistantStorageUrl("https://db.test/storage/v1/object/public/user-materials/owner/a%20b.png","https://db.test"),{bucket:"user-materials",path:"owner/a b.png"});
 assert.equal(storage.parseAssistantStorageUrl("https://db.test/storage/v1/object/public/user-materials/owner/%ZZ.png","https://db.test"),null);
 assert.equal(storage.parseAssistantStorageUrl("https://other.test/storage/v1/object/public/user-materials/owner/a.png","https://db.test"),null);
 const previousBase=process.env.SUPABASE_URL;process.env.SUPABASE_URL="https://db.test";
 await assert.rejects(storage.requireAssistantStorageOwner({rpc:async()=>({data:false,error:null})},"owner","https://db.test/storage/v1/object/public/user-materials/owner/a.png"),/ownership_unverified/);
 if(previousBase===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=previousBase;
 const polling=load("src/lib/assistant-work/polling.ts"),registry=polling.createProductionPollingRegistry();
 const loop=registry.begin("one");assert.equal(registry.begin("one"),null);const delay=polling.abortableDelay(10000,loop.controller.signal);registry.cancelAll();await assert.rejects(delay,/poll_aborted/);assert(!registry.current("one",loop.id));const second=registry.begin("one");assert(second.id>loop.id);registry.finish("one",loop.id);assert(registry.current("one",second.id));registry.cancelAll();
 const finalizer=load("src/lib/assistant-work/production-finalizer.ts");let finalCalls=0;
 const lock={task_generation:2,worker_lease:"lease",lease_expires_at:new Date(Date.now()+60000).toISOString(),step_token:"step",steps:[{token:"step",state:"started"}],provider_state:"started",finalized:false};
 const db={from:()=>({select(){return this;},eq(){return this;},single:async()=>({data:lock,error:null})}),rpc:async()=>{finalCalls++;return{data:{status:"ready"},error:null};}};
 const fence={userId:"owner",productionId:"production",taskGeneration:2,workerLease:"lease",stepToken:"step"};
 assert.deepEqual(await finalizer.finalizeAssistantProduction(db,fence,"failed",{}),{reconcileRequired:true});assert.equal(finalCalls,0);
 await assert.rejects(finalizer.finalizeAssistantProduction(db,{...fence,stepToken:null},"failed",{}),/fenced/);
 await assert.rejects(finalizer.finalizeAssistantProduction(db,{...fence,taskGeneration:1},"failed",{}),/fenced/);
 lock.steps[0].state="accepted";lock.provider_state="accepted";assert.equal((await finalizer.finalizeAssistantProduction(db,fence,"ready",{media:{kind:"video",url:"https://media.test/video.mp4"}})).status,"ready");assert.equal(finalCalls,1);
 const legacyRoute={LEGACY_IMAGE_CATEGORIES:new Set(["image","brand_kit","visual_clone","virtual_model_studio"]),resolveLegacyRoute:category=>category==="video"?{version:1,provider:"minimax",kind:"video"}:undefined,legacyRouteConfigured:()=>true};
 const mockVisuals={createVisualVideo:async input=>{const response=await input.providerFetch("https://api.minimax.io/v2/video_generation",{method:"POST",body:JSON.stringify({prompt:input.providerPrompt})});const data=await response.json();return{provider:input.provider,id:data.task_id,status:"queued"};}};
 const engine=load("src/lib/assistant-work/runMediaEngine.ts",{"./provider-rejection.ts":load("src/lib/assistant-work/provider-rejection.ts"),"./reference-contract.ts":load("src/lib/assistant-work/reference-contract.ts"),"./legacy-provider-route":legacyRoute,"../providers/stability":{},"../providers/visuals":mockVisuals,"../providers/status":{getProviderStatus:async()=>({status:"queued"})}}),catalog=load("src/lib/crelavo/categoryCatalog.ts",{"./languages":load("src/lib/crelavo/languages.ts")}),local=load("src/lib/assistant-work/runLocalEngine.ts");
 const categories=catalog.CATEGORIES || catalog.categories;
 if(categories){for(const cat of categories){assert(cat.id==="website"||local.isLocalCategory(cat.id,cat.type)||engine.getCategoryEngine(cat.id),"Uncovered category: "+cat.id);}}
 for(const category of ["documentary","animation","brand_kit","visual_clone","voice_clone","live_sales_agent","ai_agent"]){assert(engine.getCategoryEngine(category));}
 await assert.rejects(engine.runMediaEngine({category:"video",prompt:"Visual"}),/user_required/);await assert.rejects(local.runLocalEngine({category:"document_pack",prompt:"Brief"}),/user_required/);
 const originalFetch=global.fetch,originalKey=process.env.MINIMAX_API_KEY,originalRunway=process.env.RUNWAY_API_KEY,originalFal=process.env.FAL_KEY;
 process.env.MINIMAX_API_KEY="offline-fake-key";process.env.RUNWAY_API_KEY="offline-fake-fallback";process.env.FAL_KEY="offline-fake-fallback";
 let requests=[],events=[];
 const input={userId:"owner",category:"video",prompt:"Visual",spokenScript:"Only spoken words",beforeProviderCall:async endpoint=>events.push(["before",endpoint]),afterProviderCall:async state=>events.push(["after",state])};
 try {
  global.fetch=async(url,init)=>{requests.push([url,init.method]);throw new Error("lost response");};
  let result=await engine.runMediaEngine(input);assert.equal(result.providerOutcome,"uncertain");assert.equal(result.status,"reconcile_required");assert.equal(requests.length,1);assert.deepEqual(events.at(-1),["after","uncertain"]);
  requests=[];events=[];global.fetch=async(url,init)=>{requests.push([url,init.method]);return Response.json({error:"bad request"},{status:400});};
  result=await engine.runMediaEngine(input);assert.equal(result.providerOutcome,"rejected");assert.equal(result.status,"failed");assert.equal(requests.length,1);
  requests=[];events=[];global.fetch=async(url,init)=>{requests.push([url,init.method]);return Response.json({task_id:"accepted-task",base_resp:{status_code:0}});};
  result=await engine.runMediaEngine(input);assert.equal(result.providerOutcome,"accepted");assert.equal(result.status,"queued");assert.equal(result.taskId,"accepted-task");assert.equal(requests.length,1);
  requests=[];global.fetch=async(url,init)=>{requests.push([url,init.method]);return Response.json({error:"temporary"},{status:503});};
  assert.equal((await engine.pollMediaJob("owner","video","accepted-task")).status,"queued");assert(requests.every(([,method])=>method==="GET"));
  requests=[];global.fetch=async()=>{throw new Error("network");};assert.equal((await engine.pollMediaJob("owner","video","accepted-task")).status,"queued");
  global.fetch=async()=>Response.json({status:"Fail",base_resp:{status_code:0}});assert.equal((await engine.pollMediaJob("owner","video","accepted-task")).status,"failed");
 } finally {global.fetch=originalFetch;for(const [name,value] of [["MINIMAX_API_KEY",originalKey],["RUNWAY_API_KEY",originalRunway],["FAL_KEY",originalFal]]){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
 // Exercise the actual manager orchestration against an offline RPC/query double.
 process.env.ASSISTANT_PLAN_SIGNING_SECRET="offline-test-secret-with-at-least-32-characters";
 let seq=0,storedPlan=null,production=null,managerLock=null,paidDispatches=0,rpcOrder=[];
 const managerDb={from(table){const filters=[];return{select(){return this;},eq(key,value){filters.push([key,value]);return this;},async single(){let data=table==="assistant_plan_versions"?storedPlan:table==="production_requests"?production:managerLock;return {data:data&&filters.every(([k,v])=>data[k]===v)?data:null,error:null};}};},async rpc(name,args){rpcOrder.push(name);
  if(name==="reserve_assistant_revision_seq")return{data:++seq,error:null};
  if(name==="create_assistant_plan_draft"){storedPlan={id:"plan-"+seq,user_id:args.p_user_id,payload:args.p_payload,signature:args.p_signature,approved_at:null};return{data:{id:storedPlan.id},error:null};}
  if(name==="approve_assistant_plan_version"){storedPlan.approved_at=new Date().toISOString();return{data:{id:storedPlan.id,approved:true},error:null};}
  if(name==="begin_assistant_production"){if(production)return{data:{fresh:false,productionId:production.id},error:null};assert(storedPlan.approved_at);production={id:"production",user_id:"owner",status:"in_production",generation_status:"queued",output_json:{planVersionId:storedPlan.id},provider_job_id:null};managerLock={production_id:"production",user_id:"owner",task_generation:1,worker_lease:"lease",lease_expires_at:new Date(Date.now()+60000).toISOString(),step_token:null,steps:[],provider_state:"not_started",finalized:false};return{data:{fresh:true,productionId:"production",taskGeneration:1,workerLease:"lease"},error:null};}
  if(name==="start_assistant_provider_step"){assert.equal(args.p_user_id,"owner");managerLock.step_token="step";managerLock.steps.push({token:"step",state:"started"});managerLock.provider_state="started";return{data:"step",error:null};}
  if(name==="record_assistant_provider_step"){managerLock.steps.at(-1).state=args.p_state;managerLock.provider_state=args.p_state;return{data:true,error:null};}
  if(name==="save_assistant_provider_result"){production.output_json={...production.output_json,...args.p_result};production.provider_job_id=args.p_result.taskId;return{data:true,error:null};}
  if(name==="release_assistant_production_lease")return{data:true,error:null};
  throw new Error("Unexpected RPC: "+name);
 }};
 const manager=load("src/lib/assistant-work/production-manager.ts",{"./reference-contract.ts":load("src/lib/assistant-work/reference-contract.ts"),"./legacy-provider-route":legacyRoute,"../providers/reference-download.ts":{},"./conversation.ts":{converseWorkspacePlan:async()=>{rpcOrder.push("openai_mock");return{reply:"Review plan",visualDirection:"A product video",spokenScript:""};}},"./plan-signature.ts":signature,"./production-finalizer.ts":finalizer,"./storage-ownership.ts":storage,"./runMediaEngine.ts":engine,"./runLocalEngine.ts":local,"./core.ts":{quote:()=>({credits:123})},"../crelavo/categoryCatalog.ts":catalog});
 const pack=catalog.getCategory("video").packs[0],body={prompt:"A product video",scene:"1",type:"Video",packId:pack.id,extras:{sound:"no_music"},features:[]};
 const draft=await manager.handleProductionManager(managerDb,"owner","video",body);assert.equal(draft.status,"draft");assert.equal(production,null);assert.deepEqual(rpcOrder,["reserve_assistant_revision_seq","openai_mock","create_assistant_plan_draft"]);
 await assert.rejects(manager.handleProductionManager(managerDb,"owner","video",{...body,render:true,planVersionId:draft.planVersionId,planApproved:true}),/approved_current_plan_required/);assert.equal(production,null);
 await manager.handleProductionManager(managerDb,"owner","video",{...body,action:"approve_plan",planVersionId:draft.planVersionId});
 const managerFetch=global.fetch,managerKey=process.env.MINIMAX_API_KEY;process.env.MINIMAX_API_KEY="offline-fake-key";
 try{global.fetch=async()=>{paidDispatches++;assert(production);assert.equal(managerLock.provider_state,"started");return Response.json({task_id:"accepted",base_resp:{status_code:0}});};
  const result=await manager.handleProductionManager(managerDb,"owner","video",{...body,render:true,planVersionId:draft.planVersionId});assert.equal(result.status,"queued");assert.equal(paidDispatches,1);assert.equal(managerLock.provider_state,"accepted");
  const replay=await manager.handleProductionManager(managerDb,"owner","video",{...body,render:true,planVersionId:draft.planVersionId});assert(replay.idempotent);assert.equal(paidDispatches,1);
  await assert.rejects(manager.handleProductionManager(managerDb,"stranger","video",{...body,render:true,planVersionId:draft.planVersionId}),/valid_server_plan_required/);
 }finally{global.fetch=managerFetch;if(managerKey===undefined)delete process.env.MINIMAX_API_KEY;else process.env.MINIMAX_API_KEY=managerKey;if(oldSecret===undefined)delete process.env.ASSISTANT_PLAN_SIGNING_SECRET;else process.env.ASSISTANT_PLAN_SIGNING_SECRET=oldSecret;}
 const statusSource=fs.readFileSync("src/app/api/assistant-work/status/route.ts","utf8");assert(!/startFalFallback|startRunwayFallback|createVoiceover|generateStableAudio/.test(statusSource));assert(statusSource.includes(`.eq("user_id",user.id)`));
 for(const path of ["automation/start","automation/status","automation/worker","productions/cancel","productions/expire-stale","admin/productions/refund-reserved","admin/productions/recover-pending","admin/productions/reset-lost-output","admin/productions/force-ready"]){assert(fs.readFileSync("src/app/api/"+path+"/route.ts","utf8").includes("planVersionId"),"Missing legacy-manager isolation: "+path);}
 const sql=fs.readFileSync("supabase/migration_assistant_atomic_production.sql","utf8");for(const name of ["reserve_assistant_revision_seq","create_assistant_plan_draft","approve_assistant_plan_version","begin_assistant_production","recover_assistant_production","finalize_assistant_production"]){assert(sql.includes(name));}assert(sql.includes("from PUBLIC, anon, authenticated"));assert(sql.includes("to service_role"));assert.equal((sql.match(/if n<>1 then raise exception/g)||[]).length,6);assert(sql.includes("credit_period_changed"));assert(sql.includes("p_recovery and l.lease_expires_at>now()"));
 console.log("assistant-atomic-production-smoke ok: signed plans, ownership, category routing, token fencing, cancellation, accepted/rejected/uncertain, no status-paid calls. SQL structure only; no DB execution.");
})().catch(error=>{console.error(error);process.exitCode=1;});

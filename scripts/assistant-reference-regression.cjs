const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
function load(path,mocks={}){const exports={};const js=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function("require","exports",js)(id=>id in mocks?mocks[id]:require(id),exports);return exports;}
(async()=>{
 const contract=load("src/lib/assistant-work/reference-contract.ts");
 const url="https://db.test/storage/v1/object/public/user-materials/owner/ref.png";
 const image={url,kind:"image",role:"reference"};
 assert.deepEqual(contract.collectAssistantReferences([image],url),[image]);
 assert.deepEqual(contract.collectAssistantReferences([],"https://product.test/page"),[]);
 for(const invalid of [[{...image,url:"http://db.test/ref.png"}],[{...image,url:"https://user:pass@db.test/ref.png"}],[{...image,role:"unknown"}],[{url:"https://db.test/a.mp4",kind:"video",role:"first_frame"}],[image,{...image,role:"first_frame"}]]) assert.throws(()=>contract.collectAssistantReferences(invalid));
 assert.throws(()=>contract.collectAssistantReferences(Array.from({length:6},(_,i)=>({...image,url:url+"?i="+i}))),/reference_limit/);
 contract.validateAssistantReferenceRoute("stability","image",[image]);
 contract.validateAssistantReferenceRoute("minimax","video",[image,{url:"https://db.test/video.mp4",kind:"video",role:"reference"}]);
 for(const provider of ["fal","runway","kling","replicate"])assert.throws(()=>contract.validateAssistantReferenceRoute(provider,"video",[image]),/adapter_unavailable/);
 assert.throws(()=>contract.validateAssistantReferenceRoute("stability","image",[image,image]),/one_image/);
 assert.throws(()=>contract.validateAssistantReferenceRoute("minimax","video",[image,{...image,url:url+"?frame",role:"first_frame"}]),/cannot_mix/);
 assert.match(contract.assistantReferencePrompt([image]),/@Image1/);
 const originalFetch=global.fetch;global.fetch=async()=>{throw Error("Unexpected offline network call");};
 try{
  let posts=0,uploads=0;
  const stability=load("src/lib/providers/stability.ts",{"./reference-download.ts":{},"./env":{optionalEnv:()=>"",requireProviderEnv:()=>"offline-key"},"./storage":{uploadProviderAsset:async()=>{uploads++;return "https://media.test/image.png";}}});
  const input={productionId:"prod",prompt:"Same character",filenameBase:"image",referenceImageUrl:url,referenceImage:new Blob(["fixture"],{type:"image/png"}),aspectRatio:"16:9",singleAttempt:true,providerFetch:async(endpoint,init)=>{posts++;assert.equal(endpoint,"https://api.stability.ai/v2beta/stable-image/generate/sd3");assert.equal(init.method,"POST");assert.equal(init.body.get("mode"),"image-to-image");assert.equal(init.body.get("model"),"sd3.5-large");assert(init.body.get("image") instanceof Blob);return new Response("fixture",{headers:{"content-type":"image/png"}});}};
  assert.equal((await stability.createStabilityImage(input)).imageUrl,"https://media.test/image.png");assert.equal(posts,1);assert.equal(uploads,1);
  posts=0;await assert.rejects(stability.createStabilityImage({...input,providerFetch:async()=>{posts++;return new Response("rejected",{status:400});}}),/fallback disabled/);assert.equal(posts,1);
  let captured;
  const visuals=load("src/lib/providers/visuals.ts",{"../assistant-work/reference-contract.ts":contract,"./env":{optionalEnv:name=>name==="MINIMAX_API_KEY"?"offline-key":"",requireProviderEnv:()=>"offline-key"},"./minimax":{hasMiniMaxVideoConfig:()=>true,createMiniMaxH3VideoTask:async(payload,transport)=>{captured=payload;assert.equal(transport,input.providerFetch);return {task_id:"job"};},miniMaxTaskRecord:result=>({taskId:result.task_id,status:"queued"})},"@/lib/ffmpeg-runtime":{},"./minimax-production-settings":{miniMaxProductionSettings:()=>({providerPrompt:"Keep identity",resolution:"768P",duration:5,ratio:"16:9"})}});
  await visuals.createVisualVideo({productionId:"prod",scenes:["Same character"],productImageUrls:[],durationSeconds:5,provider:"minimax",references:[image],singleAttempt:true,providerFetch:input.providerFetch});
  assert.deepEqual(captured.content[1],{type:"image_url",image_url:{url},role:"reference_image"});
  await visuals.createVisualVideo({productionId:"prod",scenes:["Start here"],productImageUrls:[],durationSeconds:5,provider:"minimax",references:[{...image,role:"first_frame"}],singleAttempt:true,providerFetch:input.providerFetch});assert.equal(captured.content[1].role,"first_frame");
 }finally{global.fetch=originalFetch;}

 const oldSecret=process.env.ASSISTANT_PLAN_SIGNING_SECRET;
 process.env.ASSISTANT_PLAN_SIGNING_SECRET="offline-reference-secret-at-least-32-characters";
 try {
  const signature=load("src/lib/assistant-work/plan-signature.ts");
  let seq=0,plans=new Map(),rpcCalls=[],owned=[],dispatched=null;
  const db={from(){const filters=[];return {select(){return this;},eq(k,v){filters.push([k,v]);return this;},async single(){const id=filters.find(([k])=>k==="id")?.[1];const data=plans.get(id);return {data:data&&filters.every(([k,v])=>data[k]===v)?data:null,error:null};}};},async rpc(name,args){rpcCalls.push(name);if(name==="reserve_assistant_revision_seq")return {data:++seq,error:null};if(name==="create_assistant_plan_draft"){const id="plan-"+seq;plans.set(id,{id,user_id:"owner",payload:args.p_payload,signature:args.p_signature,approved_at:"approved"});return {data:{id},error:null};}if(name==="begin_assistant_production")return {data:{fresh:true,productionId:"prod",taskGeneration:1,workerLease:"lease"},error:null};if(["save_assistant_provider_result","release_assistant_production_lease"].includes(name))return {data:true,error:null};throw Error("Unexpected RPC: "+name);}};
  const manager=load("src/lib/assistant-work/production-manager.ts",{"./legacy-provider-route":{LEGACY_IMAGE_CATEGORIES:new Set(["image"]),resolveLegacyRoute:()=>({version:1,provider:"fal",kind:"video"}),legacyRouteConfigured:()=>true},"./production-chain.ts":load("src/lib/assistant-work/production-chain.ts"),"../providers/voice-reference-download.ts":{downloadAssistantVoiceReference:async()=>new Blob(["offline-audio"],{type:"audio/wav"})},"../providers/reference-download.ts":{},"../providers/elevenlabs":{},"./voice-clone-contract.ts":load("src/lib/assistant-work/voice-clone-contract.ts"),"./reference-contract.ts":contract,"./conversation.ts":{converseWorkspacePlan:async()=>({reply:"Review",visualDirection:"Same character",spokenScript:""})},"./plan-signature.ts":signature,"./production-finalizer.ts":{},"./storage-ownership.ts":{requireAssistantStorageOwner:async(db,userId,url)=>{assert.equal(userId,"owner");owned.push(url);if(url.includes("other"))throw Error("material_ownership_unverified");}},"./runMediaEngine.ts":{getCategoryEngine:()=>"minimax",engineConfigured:()=>true,isCopyLayoutColorOnly:()=>false,runMediaEngine:async input=>{dispatched=input;return {ok:true,status:"queued",taskId:"job",providerOutcome:"accepted"};}},"./runLocalEngine.ts":{isLocalCategory:()=>false,isCopyLayoutColorOnly:()=>false},"./core.ts":{quote:()=>({credits:10})},"../crelavo/categoryCatalog.ts":{getCategory:()=>({billing:"credits",packs:[{id:"pack",credits:10}]})}});
  const body={prompt:"Same character",type:"Video",packId:"pack",scene:"1",references:[image],extras:{duration:"5"}};
  const draft=await manager.handleProductionManager(db,"owner","video",body);
  assert.deepEqual(plans.get(draft.planVersionId).payload.input.references,[image]);assert.deepEqual(owned,[url]);assert(!rpcCalls.includes("begin_assistant_production"));
  rpcCalls=[];await assert.rejects(manager.handleProductionManager(db,"owner","video",{...body,render:true,planVersionId:draft.planVersionId}),/adapter_unavailable/);assert(!rpcCalls.includes("begin_assistant_production"));assert.equal(dispatched,null);
  const revision=await manager.handleProductionManager(db,"owner","video",{...body,references:[],referencePlanVersionId:draft.planVersionId,prompt:"Move to the next pose"});assert.deepEqual(plans.get(revision.planVersionId).payload.input.references,[image]);
  rpcCalls=[];await assert.rejects(manager.handleProductionManager(db,"owner","video",{...body,render:true,planVersionId:revision.planVersionId,references:[{...image,url:url+"?changed"}]}),/plan_references_changed/);assert(!rpcCalls.includes("begin_assistant_production"));
  await assert.rejects(manager.handleProductionManager(db,"stranger","video",{...body,referencePlanVersionId:draft.planVersionId}),/valid_server_plan_required/);
  await assert.rejects(manager.handleProductionManager(db,"owner","video",{...body,references:[{...image,url:url.replace("owner","other")}]}),/ownership_unverified/);
  // Signed MiniMax route accepts the real reference list, without reading browser render overrides.
  const plan=plans.get(revision.planVersionId);plan.payload.providerRoute.provider="minimax";plan.signature=signature.signAssistantPlan(plan.payload);rpcCalls=[];
  const result=await manager.handleProductionManager(db,"owner","video",{...body,render:true,planVersionId:revision.planVersionId});assert.equal(result.status,"queued");assert.deepEqual(dispatched.references,[image]);assert.equal(rpcCalls.filter(name=>name==="begin_assistant_production").length,1);

  const audio={url:"https://db.test/storage/v1/object/public/user-materials/owner/voice.wav",kind:"audio",role:"reference"};
  const voicePayload={...plan.payload,category:"voice_clone",input:{...plan.payload.input,references:[audio],voiceCloneConsent:{version:"voice-clone-v1",rightsConfirmed:false,userId:"owner"}},providerRoute:{version:1,provider:"elevenlabs",kind:"audio"}};
  const voicePlan={id:"voice-plan",user_id:"owner",approved_at:"approved",payload:voicePayload,signature:signature.signAssistantPlan(voicePayload)};plans.set(voicePlan.id,voicePlan);
  rpcCalls=[];await assert.rejects(manager.handleProductionManager(db,"owner","voice_clone",{...body,references:[audio],render:true,planVersionId:voicePlan.id}),/explicit_consent/);assert(!rpcCalls.includes("begin_assistant_production"));
  await assert.rejects(manager.handleProductionManager(db,"owner","voice_clone",{action:"approve_plan",planVersionId:voicePlan.id}),/explicit_consent/);assert(!rpcCalls.includes("approve_assistant_plan_version"));
  voicePayload.input.voiceCloneConsent.rightsConfirmed=true;voicePlan.signature=signature.signAssistantPlan(voicePayload);rpcCalls=[];
  await manager.handleProductionManager(db,"owner","voice_clone",{...body,references:[audio],render:true,planVersionId:voicePlan.id});assert(dispatched.preparedVoiceReference instanceof Blob);assert.equal(dispatched.voiceCloneConsent.rightsConfirmed,true);assert.equal(rpcCalls.filter(name=>name==="begin_assistant_production").length,1);
 }finally{if(oldSecret===undefined)delete process.env.ASSISTANT_PLAN_SIGNING_SECRET;else process.env.ASSISTANT_PLAN_SIGNING_SECRET=oldSecret;}
 console.log("assistant-reference-regression ok: reference parsing, conflicts, limits, source roles, provider capability, Stability multipart, MiniMax reference slots; no network or paid calls.");
})().catch(error=>{console.error(error);process.exitCode=1;});
